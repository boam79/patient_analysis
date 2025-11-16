'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface FileUploadProps {
  onDataLoaded: (data: any[], fileName: string) => void
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ rows: number; columns: number } | null>(null)

  const processFile = useCallback(async (acceptedFile: File) => {
    setLoading(true)
    setError(null)

    try {
      const fileName = acceptedFile.name
      const fileExtension = fileName.split('.').pop()?.toLowerCase()

      let parsedData: any[] = []

      if (fileExtension === 'csv') {
        // CSV 파싱
        Papa.parse(acceptedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            parsedData = results.data as any[]
            processData(parsedData, fileName)
          },
          error: (err) => {
            setError(`CSV 파싱 오류: ${err.message}`)
            setLoading(false)
          },
        })
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Excel 파싱
        const data = await acceptedFile.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        // 첫 행을 헤더로 사용
        const headers = parsedData[0] as string[]
        const rows = parsedData.slice(1).map((row: any) => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = row[index]
          })
          return obj
        })

        processData(rows, fileName)
      } else {
        setError('지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일을 업로드해주세요.')
        setLoading(false)
        return
      }
    } catch (err: any) {
      setError(`파일 처리 오류: ${err.message}`)
      setLoading(false)
    }
  }, [])

  const processData = (data: any[], fileName: string) => {
    if (data.length === 0) {
      setError('파일에 데이터가 없습니다.')
      setLoading(false)
      return
    }

    // 통계 계산
    const columns = Object.keys(data[0]).length
    setStats({ rows: data.length, columns })

    // 프리뷰 (최대 50행)
    const previewData = data.slice(0, 50)
    setPreview(previewData)

    // 부모 컴포넌트에 데이터 전달
    onDataLoaded(data, fileName)
    setLoading(false)
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const acceptedFile = acceptedFiles[0]
        setFile(acceptedFile)
        processFile(acceptedFile)
      }
    },
    [processFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  })

  const clearFile = () => {
    setFile(null)
    setPreview([])
    setStats(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <Card>
          <CardHeader>
            <CardTitle>데이터 업로드</CardTitle>
            <CardDescription>
              CSV 또는 Excel 파일을 드래그하거나 클릭하여 업로드하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                hover:border-primary hover:bg-primary/5
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-lg font-medium">파일을 놓아주세요...</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">
                    파일을 드래그하거나 클릭하여 선택
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CSV, XLS, XLSX 파일 지원
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <div>
                  <CardTitle className="text-lg">{file.name}</CardTitle>
                  <CardDescription>
                    {(file.size / 1024).toFixed(2)} KB
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                <p>파일 처리 중...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}

            {stats && !loading && !error && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-positive">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="font-medium">
                    파일 로드 완료: {stats.rows.toLocaleString()}행, {stats.columns}열
                  </p>
                </div>

                {preview.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">데이터 프리뷰 (최대 50행)</h3>
                    <div className="border rounded-lg overflow-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(preview[0]).map((header) => (
                              <th key={header} className="px-4 py-2 text-left font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, idx) => (
                            <tr key={idx} className="border-t">
                              {Object.values(row).map((cell: any, cellIdx) => (
                                <td key={cellIdx} className="px-4 py-2">
                                  {String(cell || '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

