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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/users', label: '사용자 관리', icon: Users },
  { href: '/admin/statistics', label: '통계', icon: BarChart3 },
  { href: '/admin/logs', label: '로그 분석', icon: Search },
  { href: '/admin/errors', label: '에러 로그', icon: AlertTriangle },
  { href: '/admin/monitoring', label: '모니터링', icon: Activity },
  { href: '/admin/maintenance', label: '유지보수', icon: Settings },
  { href: '/admin/audit', label: '감사 로그', icon: FileText },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white">제작자 페이지</h2>
      </div>
      <nav className="px-3">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname?.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors',
                isActive
                  ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                  : 'hover:bg-slate-800 text-slate-300'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

