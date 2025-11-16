'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUpload } from '@/components/upload/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDataStore, PatientData } from '@/stores/data-store'
import { CheckCircle2, Database, TrendingUp } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()
  const { setRawData, processData, setLoading } = useDataStore()
  
  const [uploadedData, setUploadedData] = useState<any[] | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleDataLoaded = async (data: any[], name: string) => {
    setUploadedData(data)
    setFileName(name)
    setSuccess(false)
  }

  const handleProcess = async () => {
    if (!uploadedData) return

    setProcessing(true)
    setLoading(true)

    try {
      // 데이터 변환 (CSV 컬럼명 → PatientData 형식)
      const patientData: PatientData[] = uploadedData.map((row: any) => {
        // 나이 계산 (생년월일 또는 나이 컬럼 사용)
        let age = 0
        if (row.age || row['나이']) {
          age = Number(row.age || row['나이'])
        } else if (row.birth_date || row['생년월일']) {
          const birthDateStr = (row.birth_date || row['생년월일']).toString()
          // YYYYMMDD 형식 파싱
          if (birthDateStr.length === 8) {
            const birthYear = parseInt(birthDateStr.substring(0, 4))
            age = new Date().getFullYear() - birthYear
          } else {
            // YYYY-MM-DD 형식
            const birthYear = new Date(birthDateStr).getFullYear()
            age = new Date().getFullYear() - birthYear
          }
        }

        // 성별 정규화
        let gender = '알 수 없음'
        const genderRaw = (row.gender || row['성별'] || '').toString().trim()
        if (genderRaw === 'M' || genderRaw === '남' || genderRaw === '남성' || genderRaw === '1') {
          gender = '남성'
        } else if (genderRaw === 'F' || genderRaw === '여' || genderRaw === '여성' || genderRaw === '2') {
          gender = '여성'
        }

        // 주소에서 지역 추출
        const address = row.address || row['주소'] || ''
        let region = row.region || row['지역'] || ''
        
        if (!region && address) {
          // "서울특별시 종로구 세종대로" → "서울 종로구"
          // "경기도 수원시 영통구" → "경기 수원시"
          const addressParts = address.split(' ')
          if (addressParts.length >= 2) {
            const sido = addressParts[0].replace('특별시', '').replace('광역시', '').replace('도', '')
            const sigungu = addressParts[1].replace('시', '시').replace('구', '구').replace('군', '군')
            region = `${sido} ${sigungu}`
          } else {
            region = addressParts[0] || '미분류'
          }
        }

        return {
          patient_id: (row.patient_id || row['환자ID'] || row.id || Math.random().toString()).toString(),
          visit_date: row.visit_date || row['방문일자'] || new Date().toISOString().split('T')[0],
          age,
          gender,
          disease_code: row.disease_code || row['질병코드'] || '',
          disease_name: row.disease_name || row['질병명'] || '미분류 질병',
          surgery_code: row.surgery_code || row['수술코드'] || undefined,
          surgery_name: row.surgery_name || row['수술명'] || undefined,
          address,
          region,
          latitude: row.latitude ? Number(row.latitude) : undefined,
          longitude: row.longitude ? Number(row.longitude) : undefined,
          h3_index: row.h3_index || row.h3Index || undefined,
        }
      })

      // Store에 데이터 저장
      setRawData(patientData)
      
      // 데이터 처리 (통계 계산)
      processData()

      setSuccess(true)
      setLoading(false)
      
      // 2초 후 대시보드로 자동 이동
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Processing error:', error)
      alert(`데이터 처리 중 오류가 발생했습니다: ${error.message}`)
      setLoading(false)
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

      {uploadedData && (
        <Card>
          <CardHeader>
            <CardTitle>데이터 미리보기</CardTitle>
            <CardDescription>업로드된 데이터를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">총 레코드</p>
                  <p className="text-2xl font-bold">{uploadedData.length.toLocaleString()}개</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-positive" />
                <div>
                  <p className="text-sm font-medium">파일명</p>
                  <p className="text-sm font-bold truncate">{fileName}</p>
                </div>
              </div>
            </div>
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
                처리 중...
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

