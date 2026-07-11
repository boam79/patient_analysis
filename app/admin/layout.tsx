import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/layout/admin-sidebar'
import { AdminHeader } from '@/components/admin/layout/admin-header'
import { Toaster } from 'sonner'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 로그인 페이지는 이 layout을 사용하지 않음 (무한 리다이렉트 방지)
  // Next.js는 자동으로 /admin/login은 이 layout을 건너뜀
  
  const supabase = await createClient()
  
  // 세션 확인
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login-admin')
  }

  // 사용자 프로필 조회
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_approved, name, email')
    .eq('id', user.id)
    .single()

  // ADMIN 역할 및 승인 확인
  if (!profile || !profile.is_approved || profile.role !== 'ADMIN') {
    redirect('/login-admin')
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader user={profile} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}

