'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Bell, Settings, LogOut } from 'lucide-react'

interface AdminHeaderProps {
  user: {
    name: string | null
    email: string
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login-admin')
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur-sm">
      <h1 className="font-display text-lg font-semibold text-brand-ink">관리</h1>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="알림">
          <Bell className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" aria-label="설정">
          <Settings className="h-5 w-5" />
        </Button>

        <div className="ml-2 flex items-center gap-3 border-l border-border pl-4">
          <div className="text-right">
            <p className="text-sm font-medium">{user.name || '관리자'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="로그아웃">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
