'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/upload/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { preprocessData, analyzeDataQuality } from '@/lib/preprocessor'
import { initDuckDB, insertData } from '@/lib/duckdb'
import { initIndexedDB, saveDataset } from '@/lib/indexeddb'
import { CheckCircle2, Database, TrendingUp } from 'lucide-react'

export default function UploadPage() {
  const [uploadedData, setUploadedData] = useState<any[] | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [quality, setQuality] = useState<any>(null)
  const [success, setSuccess] = useState(false)

  const handleDataLoaded = async (data: any[], name: string) => {
    setUploadedData(data)
    setFileName(name)
    setSuccess(false)

    // 초기 품질 분석
    const initialQuality = analyzeDataQuality(data)
    setQuality(initialQuality)
  }

  const handleProcess = async () => {
    if (!uploadedData) return

    setProcessing(true)
    setProgress(0)

    try {
      // IndexedDB 초기화
      await initIndexedDB()

      // 데이터 전처리
      const preprocessed = await preprocessData(uploadedData, {
        mapICD: true,
        mapEDI: true,
        geocode: false, // 첫 단계에서는 지오코딩 생략
        onProgress: (p) => setProgress(p),
      })

      // DuckDB 초기화 및 데이터 삽입
      await initDuckDB()
      await insertData('patient_data', preprocessed)

      // 품질 분석
      const finalQuality = analyzeDataQuality(preprocessed)
      setQuality(finalQuality)

      // 데이터셋 메타데이터 저장
      await saveDataset({
        name: fileName,
        rowCount: preprocessed.length,
        columnCount: Object.keys(preprocessed[0] || {}).length,
        uploadedAt: Date.now(),
      })

      setSuccess(true)
    } catch (error: any) {
      console.error('Processing error:', error)
      alert(`데이터 처리 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">데이터 업로드</h1>
        <p className="text-muted-foreground">
          환자 데이터 파일을 업로드하고 자동 전처리를 수행합니다
        </p>
      </div>

      <FileUpload onDataLoaded={handleDataLoaded} />

      {uploadedData && quality && (
        <Card>
          <CardHeader>
            <CardTitle>데이터 품질 분석</CardTitle>
            <CardDescription>업로드된 데이터의 품질을 확인하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">총 레코드</p>
                  <p className="text-2xl font-bold">{quality.totalRecords.toLocaleString()}</p>
                </div>
              </div>
              
              {quality.mappingRates.icd > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-positive" />
                  <div>
                    <p className="text-sm font-medium">ICD 매핑률</p>
                    <p className="text-2xl font-bold">{quality.mappingRates.icd.toFixed(1)}%</p>
                  </div>
                </div>
              )}
              
              {quality.mappingRates.edi > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-positive" />
                  <div>
                    <p className="text-sm font-medium">수술 코드 매핑률</p>
                    <p className="text-2xl font-bold">{quality.mappingRates.edi.toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </div>

            {Object.keys(quality.missingFields).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">누락된 필드</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(quality.missingFields).map(([field, count]: [string, any]) => (
                    <Badge key={field} variant="outline">
                      {field}: {count}개
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {uploadedData && !success && (
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleProcess}
            disabled={processing}
            size="lg"
          >
            {processing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                처리 중... {progress}%
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                데이터 처리 시작
              </>
            )}
          </Button>
        </div>
      )}

      {success && (
        <Card className="border-positive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-positive">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">
                데이터 처리가 완료되었습니다! 대시보드에서 분석을 시작할 수 있습니다.
              </p>
            </div>
            <div className="mt-4">
              <Button asChild>
                <a href="/dashboard">대시보드로 이동</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

