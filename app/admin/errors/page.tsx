import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Activity, Clock } from 'lucide-react'
import {
  getErrorLogsPage,
  getErrorStats,
} from '@/app/admin/errors/actions'
import { ErrorLogViewer } from '@/components/admin/errors/error-log-viewer'
import Link from 'next/link'

export default async function ErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    boundary?: string
    resolved?: string
    q?: string
    start?: string
    end?: string
  }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const boundary = params.boundary || 'all'
  const resolved =
    params.resolved === 'open' || params.resolved === 'resolved'
      ? params.resolved
      : 'all'

  let stats = { total: 0, last24h: 0, open: 0 }
  let result = {
    logs: [] as Awaited<ReturnType<typeof getErrorLogsPage>>['logs'],
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  }

  try {
    ;[stats, result] = await Promise.all([
      getErrorStats(),
      getErrorLogsPage({
        page,
        pageSize: 50,
        boundary,
        resolved,
        search: params.q,
        startDate: params.start,
        endDate: params.end,
      }),
    ])
  } catch (e) {
    console.error('Error fetching error_logs:', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">에러 로그</h1>
        <p className="mt-2 text-muted-foreground">
          클라이언트 사이드 런타임 에러 자동 수집 (Next.js 에러 바운더리 기반)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 24시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.last24h}</div>
            <p className="text-xs text-muted-foreground">발생한 에러 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">미해결</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">resolved=false</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">누적 에러 로그</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>에러 로그 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorLogViewer
            logs={result.logs as any}
            boundary={boundary}
            resolvedFilter={resolved}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {result.total}건 · {result.page}/{result.totalPages} 페이지
            </span>
            <div className="flex gap-3">
              {result.page > 1 && (
                <Link
                  href={`/admin/errors?page=${result.page - 1}&boundary=${boundary}&resolved=${resolved}`}
                  className="text-primary hover:underline"
                >
                  이전
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={`/admin/errors?page=${result.page + 1}&boundary=${boundary}&resolved=${resolved}`}
                  className="text-primary hover:underline"
                >
                  다음
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
