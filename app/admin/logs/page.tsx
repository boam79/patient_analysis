import { createClient } from '@/lib/supabase/server'
import { IpLogViewer } from '@/components/admin/logs/ip-log-viewer'
import { IpStatisticsDashboard } from '@/components/admin/logs/ip-statistics-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function LogsPage() {
  const supabase = await createClient()

  // IP 로그 조회 (최근 1000개)
  const { data: ipLogs, error } = await supabase
    .from('ip_access_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) {
    console.error('Error fetching IP logs:', error)
  }

  // 통계 계산
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { count: todayCount } = await supabase
    .from('ip_access_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // 고유 IP 수
  const { data: uniqueIps } = await supabase
    .from('ip_access_logs')
    .select('ip_address')
    .limit(10000)

  const uniqueIpCount = new Set(uniqueIps?.map(log => log.ip_address) || []).size

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">로그 분석</h1>
        <p className="text-muted-foreground mt-2">
          IP 접근 로그 조회 및 분석
        </p>
      </div>

      {/* 통계 카드 */}
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
            <div className="text-2xl font-bold">{ipLogs?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* 탭으로 통계와 로그 분리 */}
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
            <CardContent>
              <IpLogViewer logs={ipLogs || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

