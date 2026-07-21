import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuditLogs, getAuditStats } from '@/app/admin/audit/actions'
import { AuditLogViewer } from '@/components/admin/audit/audit-log-viewer'
import { FileText, Activity, Users } from 'lucide-react'
import Link from 'next/link'

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const action = params.action && params.action !== 'all' ? params.action : undefined

  let stats = { total: 0, actionCounts: [] as Array<{ action: string; count: number }>, topUsers: [] as Array<{ userId: string; count: number }> }
  let result = {
    logs: [] as Awaited<ReturnType<typeof getAuditLogs>>['logs'],
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  }

  try {
    ;[stats, result] = await Promise.all([
      getAuditStats(7),
      getAuditLogs({ page, pageSize: 50, action }),
    ])
  } catch (e) {
    console.error('Error fetching audit data:', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">감사 로그</h1>
        <p className="mt-2 text-muted-foreground">
          모든 관리자 액션 기록 및 추적
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 7일 활동</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">총 관리자 액션 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">액션 유형</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.actionCounts.length}</div>
            <p className="text-xs text-muted-foreground">고유 액션 타입 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활동 관리자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topUsers.length}</div>
            <p className="text-xs text-muted-foreground">최근 활동한 관리자 수</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>감사 로그 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuditLogViewer logs={result.logs as any} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {result.total}건 · {result.page}/{result.totalPages} 페이지
            </span>
            <div className="flex gap-3">
              {result.page > 1 && (
                <Link
                  href={`/admin/audit?page=${result.page - 1}`}
                  className="text-primary hover:underline"
                >
                  이전
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={`/admin/audit?page=${result.page + 1}`}
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
