'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, Menu, X, LayoutDashboard, Map, LineChart } from 'lucide-react'
import { useDataStore } from '@/stores/data-store'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/map', label: '지도 분석', icon: Map },
  { href: '/dashboard/strategy', label: '전략 분석', icon: LineChart },
]

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { isDataLoaded, totalPatients } = useDataStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link
              href="/"
              className="font-display text-xl font-bold text-brand transition-opacity hover:opacity-80 md:text-2xl"
              aria-label="메인으로 이동"
              onClick={() => setMobileOpen(false)}
            >
              병원 CRM
            </Link>
            {isDataLoaded && (
              <span className="hidden sm:inline text-xs tabular-nums text-muted-foreground">
                {totalPatients.toLocaleString()}명 로드됨
              </span>
            )}
            <nav className="hidden lg:flex items-center gap-1 ml-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2',
                      active
                        ? 'border-primary text-brand'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => router.push('/dashboard/upload')}
            >
              <Upload className="mr-2 h-4 w-4" />
              데이터 업로드
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="메뉴"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden mt-3 flex flex-col gap-1 border-t border-border/60 pt-3 pb-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium',
                    active
                      ? 'bg-accent text-brand'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <Button
              variant="default"
              size="sm"
              className="mt-2 sm:hidden"
              onClick={() => {
                setMobileOpen(false)
                router.push('/dashboard/upload')
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              데이터 업로드
            </Button>
          </nav>
        )}
      </div>
    </header>
  )
}
