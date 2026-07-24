'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, LayoutDashboard, Map, LineChart } from 'lucide-react'
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
  const { isDataLoaded, totalPatients, rawData, kpiWindowSize, recurrenceRate } = useDataStore()
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
                <span
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  title={`업로드 요약 재방문율 ${recurrenceRate.toFixed(1)}% (${kpiWindowSize}일)`}
                >
                  요약 {kpiWindowSize}일
                </span>
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
            {/* 모바일은 하단 탭(MobileBottomNav) 사용 — 햄버거 중복 제거 */}
          </div>
        </div>
      </div>
    </header>
  )
}
