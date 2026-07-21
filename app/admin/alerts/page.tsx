import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Activity, Clock } from 'lucide-react'
import { getSystemAlertsPage, getSystemAlertStats } from '@/app/admin/alerts/actions'
import { SystemAlertsViewer } from '@/components/admin/alerts/system-alerts-viewer'
import Link from 'next/link'

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; severity?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const severity = params.severity || 'all'

  let stats = { total: 0, last24h: 0, last7d: 0 }
  let result = {
    alerts: [] as Awaited<ReturnType<typeof getSystemAlertsPage>>['alerts'],
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  }

  try {
    ;[stats, result] = await Promise.all([
      getSystemAlertStats(),
      getSystemAlertsPage({ page, pageSize: 50, severity }),
    ])
  } catch (e) {
    console.error('alerts page load failed:', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">시스템 알림</h1>
        <p className="mt-2 text-muted-foreground">
          이상탐지 크론이 발송한 Slack 알림 이력 (`system_alerts`)
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 7일</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.last7d}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>알림 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <SystemAlertsViewer
            alerts={result.alerts}
            page={result.page}
            totalPages={result.totalPages}
            severity={severity}
          />
          {result.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {result.total}건 · {result.page}/{result.totalPages} 페이지
              </span>
              <div className="flex gap-2">
                {result.page > 1 && (
                  <Link
                    className="text-primary hover:underline"
                    href={`/admin/alerts?page=${result.page - 1}&severity=${severity}`}
                  >
                    이전
                  </Link>
                )}
                {result.page < result.totalPages && (
                  <Link
                    className="text-primary hover:underline"
                    href={`/admin/alerts?page=${result.page + 1}&severity=${severity}`}
                  >
                    다음
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
