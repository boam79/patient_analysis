'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Bell, Settings, LogOut, Menu } from 'lucide-react'

interface AdminHeaderProps {
  user: {
    name: string | null
    email: string
  }
  onMenuClick?: () => void
}

export function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login-admin')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <p className="font-display text-sm font-semibold text-brand-ink sm:text-base">
          제작자 콘솔
        </p>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" aria-label="알림" asChild>
          <Link href="/admin/alerts">
            <Bell className="h-5 w-5" />
          </Link>
        </Button>

        <Button variant="ghost" size="icon" aria-label="설정" asChild>
          <Link href="/admin/maintenance">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>

        <div className="ml-1 flex items-center gap-2 border-l border-border pl-3 sm:ml-2 sm:gap-3 sm:pl-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user.name || '관리자'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="로그아웃"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
