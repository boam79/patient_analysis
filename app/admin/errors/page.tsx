import { createClient } from '@/lib/supabase/server'
import { ErrorLogViewer } from '@/components/admin/errors/error-log-viewer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Activity, Clock } from 'lucide-react'

export default async function ErrorsPage() {
  const supabase = await createClient()

  const { data: errorLogs, error } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching error_logs:', error)
  }

  const logs = errorLogs || []
  const last24h = logs.filter(
    (log) => new Date(log.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
  )
  const boundaryCounts = new Map<string, number>()
  logs.forEach((log) => {
    boundaryCounts.set(log.boundary, (boundaryCounts.get(log.boundary) || 0) + 1)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">에러 로그</h1>
        <p className="text-muted-foreground mt-2">
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
            <div className="text-2xl font-bold">{last24h.length}</div>
            <p className="text-xs text-muted-foreground">발생한 에러 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 (최근 200건)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">조회된 로그 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">영역별 분포</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{boundaryCounts.size}</div>
            <p className="text-xs text-muted-foreground">고유 에러 바운더리 수</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>에러 로그 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorLogViewer logs={logs} />
        </CardContent>
      </Card>
    </div>
  )
}
