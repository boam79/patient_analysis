import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/layout/admin-shell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login-admin')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_approved, name, email')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_approved || profile.role !== 'ADMIN') {
    redirect('/login-admin')
  }

  return (
    <AdminShell
      user={{
        name: profile.name,
        email: profile.email,
      }}
    >
      {children}
    </AdminShell>
  )
}
