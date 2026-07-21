import { getUsersPage } from '@/app/admin/users/actions'
import { UserManagementTable } from '@/components/admin/users/user-management-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'

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
      search: params.q,
      role: params.role,
      approval,
    })
  } catch (e) {
    console.error('Error fetching users:', e)
  }

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
          <UserManagementTable users={result.users || []} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {result.total}명 · {result.page}/{result.totalPages} 페이지
            </span>
            <div className="flex gap-3">
              {result.page > 1 && (
                <Link
                  href={`/admin/users?page=${result.page - 1}`}
                  className="text-primary hover:underline"
                >
                  이전
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={`/admin/users?page=${result.page + 1}`}
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
