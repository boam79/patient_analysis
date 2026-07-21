import { getUsersPage } from '@/app/admin/users/actions'
import { UserManagementTable } from '@/components/admin/users/user-management-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'

function buildUsersQuery(params: {
  page?: number
  q?: string
  role?: string
  approval?: string
}) {
  const sp = new URLSearchParams()
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  if (params.q) sp.set('q', params.q)
  if (params.role && params.role !== 'all') sp.set('role', params.role)
  if (params.approval && params.approval !== 'all') {
    sp.set('approval', params.approval)
  }
  const qs = sp.toString()
  return qs ? `/admin/users?${qs}` : '/admin/users'
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    q?: string
    role?: string
    approval?: string
  }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const q = params.q || ''
  const role = params.role || 'all'
  const approval =
    params.approval === 'approved' || params.approval === 'pending'
      ? params.approval
      : 'all'

  let result = {
    users: [] as Awaited<ReturnType<typeof getUsersPage>>['users'],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  }

  try {
    result = await getUsersPage({
      page,
      pageSize: 20,
      search: q || undefined,
      role,
      approval,
    })
  } catch (e) {
    console.error('Error fetching users:', e)
  }

  const approvedAdminCount = (result.users || []).filter(
    (u) => u.role === 'ADMIN' && u.is_approved
  ).length

  // 현재 페이지에 마지막 ADMIN만 있을 수 있으므로 total에서 별도 조회가 이상적이나
  // UI 가드는 서버 액션이 최종 방어. 페이지 내 승인 ADMIN 수로 힌트만 제공.
  const queryBase = { q: q || undefined, role, approval }

  return (
    <div className="space-y-6">
      <PageHeader
        title="사용자 관리"
        description="사용자 목록 조회, 승인, 역할 변경 및 삭제"
      />

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            method="get"
            action="/admin/users"
            className="flex flex-wrap gap-2"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="이메일·이름 검색"
              className="min-w-[180px] flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <select
              name="role"
              defaultValue={role}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="all">모든 역할</option>
              <option value="ADMIN">ADMIN</option>
              <option value="ANALYST">ANALYST</option>
              <option value="VIEWER">VIEWER</option>
              <option value="USER">USER</option>
            </select>
            <select
              name="approval"
              defaultValue={approval}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="all">승인 전체</option>
              <option value="approved">승인됨</option>
              <option value="pending">대기</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              검색
            </button>
          </form>

          <UserManagementTable
            users={result.users || []}
            approvedAdminCountHint={approvedAdminCount}
            totalCount={result.total}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {result.total}명 · {result.page}/{result.totalPages} 페이지
            </span>
            <div className="flex gap-3">
              {result.page > 1 && (
                <Link
                  href={buildUsersQuery({ ...queryBase, page: result.page - 1 })}
                  className="text-primary hover:underline"
                >
                  이전
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={buildUsersQuery({ ...queryBase, page: result.page + 1 })}
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
