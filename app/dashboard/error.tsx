'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { reportClientError } from '@/lib/error-logging'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error Boundary]', error)
    reportClientError(error, 'dashboard')
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>대시보드를 표시할 수 없습니다</CardTitle>
          <CardDescription>
            데이터 처리 중 오류가 발생했습니다. 업로드된 데이터 형식을 확인하거나 다시 시도해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {process.env.NODE_ENV === 'development' && (
            <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {error.message}
            </pre>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/dashboard/upload">
                <Upload className="mr-2 h-4 w-4" />
                데이터 다시 업로드
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
