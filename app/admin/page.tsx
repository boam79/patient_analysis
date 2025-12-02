import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, Search, FileText } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 통계 데이터 조회
  const [usersResult, sessionsResult, logsResult, auditResult] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('ip_access_logs').select('id', { count: 'exact', head: true }),
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
  ])

  const stats = {
    totalUsers: usersResult.count || 0,
    activeSessions: sessionsResult.count || 0,
    ipLogs: logsResult.count || 0,
    auditLogs: auditResult.count || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">제작자 대시보드</h1>
        <p className="text-muted-foreground mt-2">
          시스템 전체 통계 및 빠른 액션
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              전체 등록된 사용자 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 세션</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              현재 활성 세션 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IP 로그</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ipLogs}</div>
            <p className="text-xs text-muted-foreground">
              총 IP 접근 로그 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">감사 로그</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.auditLogs}</div>
            <p className="text-xs text-muted-foreground">
              관리자 액션 기록 수
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 액션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <h3 className="font-medium">사용자 관리</h3>
                <p className="text-sm text-muted-foreground">사용자 목록 조회 및 승인</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <h3 className="font-medium">IP 로그 조회</h3>
                <p className="text-sm text-muted-foreground">메인 대시보드 접근 로그 확인</p>
              </div>
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

