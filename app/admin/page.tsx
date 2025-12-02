import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, Search, FileText, UserCheck, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 통계 데이터 조회
  const [
    usersResult,
    approvedUsersResult,
    pendingUsersResult,
    sessionsResult,
    activeSessions24hResult,
    logsResult,
    todayLogsResult,
    auditResult,
    recentAuditResult,
  ] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('user_sessions').select('id', { count: 'exact', head: true }),
    supabase.from('user_sessions').select('id', { count: 'exact', head: true })
      .gte('login_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('ip_access_logs').select('id', { count: 'exact', head: true }),
    supabase.from('ip_access_logs').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]),
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  // 최근 7일간 활성 사용자 수
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: activeUsers7d } = await supabase
    .from('user_sessions')
    .select('user_id')
    .gte('login_at', sevenDaysAgo)
  
  const uniqueActiveUsers7d = new Set(activeUsers7d?.map(s => s.user_id) || []).size

  const stats = {
    totalUsers: usersResult.count || 0,
    approvedUsers: approvedUsersResult.count || 0,
    pendingUsers: pendingUsersResult.count || 0,
    totalSessions: sessionsResult.count || 0,
    activeSessions24h: activeSessions24hResult.count || 0,
    activeUsers7d: uniqueActiveUsers7d,
    ipLogs: logsResult.count || 0,
    todayIpLogs: todayLogsResult.count || 0,
    auditLogs: auditResult.count || 0,
    recentAuditLogs: recentAuditResult.data || [],
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
              승인: {stats.approvedUsers} | 대기: {stats.pendingUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers7d}</div>
            <p className="text-xs text-muted-foreground">
              최근 7일간 활성 사용자
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
              오늘: {stats.todayIpLogs} | 총: {stats.ipLogs}
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

      {/* 추가 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인된 사용자</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedUsers}</div>
            <p className="text-xs text-muted-foreground">
              전체의 {stats.totalUsers > 0 ? Math.round((stats.approvedUsers / stats.totalUsers) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 세션</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              최근 24시간: {stats.activeSessions24h}
            </p>
          </CardContent>
        </Card>

        {stats.pendingUsers > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingUsers}</div>
              <p className="text-xs text-muted-foreground">
                승인 대기 중인 사용자
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 최근 활동 */}
      {stats.recentAuditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              최근 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentAuditLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {log.resource && `• ${log.resource}`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/admin/audit"
                className="text-sm text-primary hover:underline"
              >
                모든 감사 로그 보기 →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 액션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/users" className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div>
                <h3 className="font-medium">사용자 관리</h3>
                <p className="text-sm text-muted-foreground">사용자 목록 조회 및 승인</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </Link>
            <Link href="/admin/logs" className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div>
                <h3 className="font-medium">IP 로그 조회</h3>
                <p className="text-sm text-muted-foreground">메인 대시보드 접근 로그 확인</p>
              </div>
              <Search className="h-5 w-5 text-muted-foreground" />
            </Link>
            <Link href="/admin/statistics" className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div>
                <h3 className="font-medium">통계 분석</h3>
                <p className="text-sm text-muted-foreground">사용자 및 사용량 통계</p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </Link>
            <Link href="/admin/audit" className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div>
                <h3 className="font-medium">감사 로그</h3>
                <p className="text-sm text-muted-foreground">관리자 액션 기록</p>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
