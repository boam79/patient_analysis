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
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type MenuItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

type MenuSection = {
  title: string
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    title: '개요',
    items: [
      { href: '/admin', label: '대시보드', icon: LayoutDashboard },
      { href: '/admin/monitoring', label: '모니터링', icon: Activity },
    ],
  },
  {
    title: '사용자',
    items: [{ href: '/admin/users', label: '사용자 관리', icon: Users }],
  },
  {
    title: '관측',
    items: [
      { href: '/admin/logs', label: '로그 분석', icon: Search },
      { href: '/admin/errors', label: '에러 로그', icon: AlertTriangle },
      { href: '/admin/alerts', label: '시스템 알림', icon: Bell },
      { href: '/admin/statistics', label: '통계', icon: BarChart3 },
    ],
  },
  {
    title: '운영',
    items: [
      { href: '/admin/maintenance', label: '유지보수', icon: Settings },
      { href: '/admin/audit', label: '감사 로그', icon: FileText },
    ],
  },
]

interface AdminSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const nav = (
    <>
      <div className="flex items-center justify-between p-6">
        <div>
          <Link
            href="/"
            className="font-display text-xl font-bold text-white"
            onClick={onClose}
          >
            병원 CRM
          </Link>
          <p className="mt-1 text-xs text-white/55">제작자 콘솔</p>
        </div>
        {onClose ? (
          <button
            type="button"
            className="rounded-md p-2 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-8">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname?.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                      isActive
                        ? 'border-l-2 border-primary bg-white/10 pl-[10px] text-white'
                        : 'text-white/70 hover:bg-white/5'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-brand-ink text-primary-foreground/80 lg:flex lg:min-h-screen">
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            'absolute inset-0 bg-brand-ink/40 transition-opacity',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={onClose}
          aria-label="메뉴 닫기"
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col bg-brand-ink text-primary-foreground/80 shadow-xl transition-transform duration-200',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {nav}
        </aside>
      </div>
    </>
  )
}
