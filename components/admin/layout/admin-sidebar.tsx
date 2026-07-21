'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Search,
  Activity,
  Settings,
  FileText,
  AlertTriangle,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/users', label: '사용자 관리', icon: Users },
  { href: '/admin/statistics', label: '통계', icon: BarChart3 },
  { href: '/admin/logs', label: '로그 분석', icon: Search },
  { href: '/admin/errors', label: '에러 로그', icon: AlertTriangle },
  { href: '/admin/alerts', label: '시스템 알림', icon: Bell },
  { href: '/admin/monitoring', label: '모니터링', icon: Activity },
  { href: '/admin/maintenance', label: '유지보수', icon: Settings },
  { href: '/admin/audit', label: '감사 로그', icon: FileText },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="min-h-screen w-64 border-r border-border bg-brand-ink text-primary-foreground/80">
      <div className="p-6">
        <Link href="/" className="font-display text-xl font-bold text-white">
          병원 CRM
        </Link>
        <p className="mt-1 text-xs text-white/55">제작자 콘솔</p>
      </div>
      <nav className="px-3 pb-6">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'mb-1 flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                isActive
                  ? 'bg-white/10 text-white border-l-2 border-primary pl-[10px]'
                  : 'hover:bg-white/5 text-white/70'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
