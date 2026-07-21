import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Database, AlertTriangle, Bell, Search } from 'lucide-react'
import { getMonitoringHealth } from '@/app/admin/maintenance/actions'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default async function MonitoringPage() {
  let health: Awaited<ReturnType<typeof getMonitoringHealth>> | null = null
  let loadError: string | null = null

  try {
    health = await getMonitoringHealth()
  } catch (e) {
    loadError = e instanceof Error ? e.message : '헬스 조회 실패'
  }

  const dbOk = health?.database.status === 'healthy'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">시스템 모니터링</h1>
        <p className="text-muted-foreground mt-2">
          Supabase·에러·알림 기반 슬림 헬스 (Vercel CPU/메모리는 대시보드에서 확인)
        </p>
      </div>

      {loadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">
            {loadError}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">데이터베이스</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${dbOk ? 'text-emerald-700' : 'text-destructive'}`}
            >
              {health ? (dbOk ? '정상' : '오류') : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {health?.database.message || '조회 대기'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">에러 (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.errorLogs24h ?? '—'}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/admin/errors" className="text-primary hover:underline">
                에러 로그 보기 →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">알림 (24h)</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.systemAlerts24h ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link href="/admin/alerts" className="text-primary hover:underline">
                시스템 알림 →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 IP 접근</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.ipLogsToday ?? '—'}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/admin/logs" className="text-primary hover:underline">
                로그 분석 →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            시스템 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            CPU·메모리·API 지연은 Vercel 서버리스에서 앱 내부 측정이 불가하여
            표시하지 않습니다. Vercel / Supabase 대시보드를 이용해 주세요.
          </p>
          {health?.checkedAt && (
            <p>
              마지막 확인:{' '}
              {format(new Date(health.checkedAt), 'yyyy-MM-dd HH:mm:ss', {
                locale: ko,
              })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
