'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin Error Boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>제작자 페이지 오류</CardTitle>
          <CardDescription>
            관리자 화면을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
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
              <Link href="/admin">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                관리자 홈
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
