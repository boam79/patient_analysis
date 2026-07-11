'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onDataLoaded: (data: any[], fileName: string) => void
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ rows: number; columns: number } | null>(null)

  const finishData = useCallback((data: any[], fileName: string) => {
    if (data.length === 0) {
      setError('파일에 데이터가 없습니다.')
      setLoading(false)
      return
    }

    const columns = Object.keys(data[0]).length
    setStats({ rows: data.length, columns })
    setPreview(data.slice(0, 50))
    onDataLoaded(data, fileName)
    setLoading(false)
  }, [onDataLoaded])

  const processFile = useCallback(async (acceptedFile: File) => {
    setLoading(true)
    setError(null)

    try {
      const fileName = acceptedFile.name
      const fileExtension = fileName.split('.').pop()?.toLowerCase()

      let parsedData: any[] = []

      if (fileExtension === 'csv') {
        Papa.parse(acceptedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            parsedData = results.data as any[]
            finishData(parsedData, fileName)
          },
          error: (err) => {
            setError(`CSV 파싱 오류: ${err.message}`)
            setLoading(false)
          },
        })
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const data = await acceptedFile.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        const headers = parsedData[0] as string[]
        const rows = parsedData.slice(1).map((row: any) => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = row[index]
          })
          return obj
        })

        finishData(rows, fileName)
      } else {
        setError('지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일을 업로드해주세요.')
        setLoading(false)
        return
      }
    } catch (err: any) {
      setError(`파일 처리 오류: ${err.message}`)
      setLoading(false)
    }
  }, [finishData])

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
        <div
          {...getRootProps()}
          className={cn(
            'cursor-pointer rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-200',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-primary/35 bg-card/60 hover:border-primary hover:bg-primary/5'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-4 h-12 w-12 text-brand" />
          {isDragActive ? (
            <p className="font-display text-lg font-semibold">파일을 놓아주세요...</p>
          ) : (
            <>
              <p className="font-display text-lg font-semibold mb-2">
                CSV 또는 Excel 파일을 놓으세요
              </p>
              <p className="text-sm text-muted-foreground">
                클릭하거나 드래그 · CSV, XLS, XLSX
              </p>
            </>
          )}
          {loading && (
            <p className="mt-4 text-sm text-brand">파일 읽는 중...</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-brand" />
              <div className="min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                  {stats ? ` · ${stats.rows.toLocaleString()}행 · ${stats.columns}열` : ''}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile} aria-label="파일 제거">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {preview.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-md border border-border/70">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    {Object.keys(preview[0]).slice(0, 6).map((key) => (
                      <th key={key} className="px-3 py-2 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border/50">
                      {Object.keys(preview[0])
                        .slice(0, 6)
                        .map((key) => (
                          <td key={key} className="max-w-[140px] truncate px-3 py-1.5 text-muted-foreground">
                            {String(row[key] ?? '')}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {file && !error && stats && (
        <div className="flex items-center gap-2 text-sm text-positive">
          <CheckCircle2 className="h-4 w-4" />
          파일 준비 완료
        </div>
      )}
    </div>
  )
}
