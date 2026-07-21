import { createClient } from '@/lib/supabase/server'
import { IpLogViewer } from '@/components/admin/logs/ip-log-viewer'
import { IpStatisticsDashboard } from '@/components/admin/logs/ip-statistics-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 100
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()

  const { data: ipLogs, error, count: pageCount } = await supabase
    .from('ip_access_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching IP logs:', error)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [{ count: todayCount }, { count: totalCount }] = await Promise.all([
    supabase
      .from('ip_access_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString()),
    supabase
      .from('ip_access_logs')
      .select('*', { count: 'exact', head: true }),
  ])

  const { data: uniqueIps } = await supabase
    .from('ip_access_logs')
    .select('ip_address')
    .limit(10000)

  const uniqueIpCount = new Set(uniqueIps?.map((log) => log.ip_address) || []).size
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize))

  return (
    <div className="space-y-6">
      <PageHeader
        title="로그 분석"
        description="IP 접근 로그 조회 및 분석"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">오늘 접속</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">고유 IP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueIpCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 로그</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              현재 페이지 {pageCount ?? ipLogs?.length ?? 0}건 표시
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="statistics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statistics">통계 분석</TabsTrigger>
          <TabsTrigger value="logs">로그 조회</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-4">
          <IpStatisticsDashboard />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IP 접근 로그</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <IpLogViewer logs={ipLogs || []} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {totalCount || 0}건 · {page}/{totalPages} 페이지
                </span>
                <div className="flex gap-3">
                  {page > 1 && (
                    <Link
                      href={`/admin/logs?page=${page - 1}`}
                      className="text-primary hover:underline"
                    >
                      이전
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/admin/logs?page=${page + 1}`}
                      className="text-primary hover:underline"
                    >
                      다음
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
