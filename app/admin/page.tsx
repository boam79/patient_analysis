import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Search, FileText, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { MetricStrip } from '@/components/layout/metric-strip'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

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
    supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', true),
    supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', false),
    supabase.from('user_sessions').select('id', { count: 'exact', head: true }),
    supabase
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .gte(
        'login_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      ),
    supabase.from('ip_access_logs').select('id', { count: 'exact', head: true }),
    supabase
      .from('ip_access_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]),
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString()
  const { data: activeUsers7d } = await supabase
    .from('user_sessions')
    .select('user_id')
    .gte('login_at', sevenDaysAgo)

  const uniqueActiveUsers7d = new Set(
    activeUsers7d?.map((s) => s.user_id) || []
  ).size

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

  const approvedPct =
    stats.totalUsers > 0
      ? Math.round((stats.approvedUsers / stats.totalUsers) * 100)
      : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="제작자 대시보드"
        description="시스템 전체 통계 및 빠른 액션"
      />

      <MetricStrip
        items={[
          {
            label: '총 사용자',
            value: stats.totalUsers,
            hint: `승인 ${stats.approvedUsers} · 대기 ${stats.pendingUsers}`,
            accent: stats.pendingUsers > 0 ? 'warning' : 'default',
          },
          {
            label: '활성 (7일)',
            value: stats.activeUsers7d,
            hint: `세션 24h ${stats.activeSessions24h}`,
          },
          {
            label: 'IP 로그',
            value: stats.ipLogs,
            hint: `오늘 ${stats.todayIpLogs}`,
          },
          {
            label: '감사 로그',
            value: stats.auditLogs,
            hint: `승인률 ${approvedPct}%`,
          },
        ]}
      />

      {stats.recentAuditLogs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Clock className="h-5 w-5" />
              최근 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentAuditLogs.map((log: { id: string; action: string; resource?: string; created_at: string }) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b border-border/60 py-2 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.action}</span>
                      {log.resource ? (
                        <span className="text-xs text-muted-foreground">
                          · {log.resource}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss', {
                        locale: ko,
                      })}
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
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            아직 감사 로그가 없습니다.{' '}
            <Link href="/admin/users" className="text-primary hover:underline">
              사용자 관리
            </Link>
            에서 액션을 수행해 보세요.
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-brand-ink">
          빠른 액션
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: '/admin/users',
              title: '사용자 관리',
              desc: '승인·역할·삭제',
              icon: Users,
            },
            {
              href: '/admin/logs',
              title: '로그 분석',
              desc: 'IP·이상탐지',
              icon: Search,
            },
            {
              href: '/admin/statistics',
              title: '통계',
              desc: '가입·세션 추이',
              icon: TrendingUp,
            },
            {
              href: '/admin/audit',
              title: '감사 로그',
              desc: '관리자 액션',
              icon: FileText,
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-lg border border-border/80 bg-card/80 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div>
                  <h3 className="font-medium text-brand-ink">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
