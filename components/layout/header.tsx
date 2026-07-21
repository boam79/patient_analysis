'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, Menu, X, LayoutDashboard, Map, LineChart } from 'lucide-react'
import { useDataStore } from '@/stores/data-store'
import { isUsingSampleData } from '@/lib/sample-data'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/map', label: '지도 분석', icon: Map },
  { href: '/dashboard/strategy', label: '전략 분석', icon: LineChart },
  { href: '/dashboard/upload', label: '업로드', icon: Upload },
]

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { isDataLoaded, totalPatients, rawData } = useDataStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const usingSample = isUsingSampleData(isDataLoaded, rawData)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            <Link
              href="/"
              className="font-display text-xl font-bold text-brand transition-opacity hover:opacity-80 md:text-2xl"
              aria-label="메인으로 이동"
              onClick={() => setMobileOpen(false)}
            >
              병원 CRM
            </Link>
            {isDataLoaded && (
              <button
                type="button"
                onClick={() => router.push('/dashboard/upload')}
                className="hidden items-center gap-1.5 rounded-md border border-border/80 bg-card px-2 py-1 text-xs tabular-nums text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:inline-flex"
                title="데이터 업로드로 이동"
              >
                {totalPatients.toLocaleString()}명
                {usingSample ? (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                    샘플
                  </span>
                ) : (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                    실데이터
                  </span>
                )}
              </button>
            )}
            <nav className="ml-1 hidden items-center gap-1 lg:flex">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
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
              className="hidden sm:inline-flex lg:hidden"
              onClick={() => router.push('/dashboard/upload')}
            >
              <Upload className="mr-2 h-4 w-4" />
              업로드
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
          <nav className="mt-3 flex flex-col gap-1 border-t border-border/60 pb-1 pt-3 lg:hidden">
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
          </nav>
        )}
      </div>
    </header>
  )
}
