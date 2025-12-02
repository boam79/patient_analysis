import { createClient } from '@/lib/supabase/server'
import { AuditLogViewer } from '@/components/admin/audit/audit-log-viewer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuditStats } from '@/app/admin/audit/actions'
import { FileText, Activity, Users } from 'lucide-react'

export default async function AuditPage() {
  const supabase = await createClient()

  // 감사 로그 조회 (사용자 정보 포함)
  const { data: auditLogs, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      user_profiles!audit_logs_user_id_fkey (
        email,
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching audit logs:', error)
  }

  // 통계 조회
  let stats
  try {
    stats = await getAuditStats(7)
  } catch (error) {
    console.error('Error fetching audit stats:', error)
    stats = { total: 0, actionCounts: [], topUsers: [] }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">감사 로그</h1>
        <p className="text-muted-foreground mt-2">
          모든 관리자 액션 기록 및 추적
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 7일 활동</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              총 관리자 액션 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">액션 유형</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.actionCounts.length}</div>
            <p className="text-xs text-muted-foreground">
              고유 액션 타입 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활동 관리자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              최근 활동한 관리자 수
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 감사 로그 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>감사 로그 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogViewer logs={auditLogs || []} />
        </CardContent>
      </Card>
    </div>
  )
}

