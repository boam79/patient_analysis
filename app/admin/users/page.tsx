import { createClient } from '@/lib/supabase/server'
import { UserManagementTable } from '@/components/admin/users/user-management-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UsersPage() {
  const supabase = await createClient()

  // 사용자 목록 조회
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground mt-2">
          사용자 목록 조회, 승인, 역할 변경 및 삭제
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagementTable users={users || []} />
        </CardContent>
      </Card>
    </div>
  )
}

