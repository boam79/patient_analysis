'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Map, LineChart, MoreHorizontal, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const primaryTabs = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/map', label: '지도', icon: Map },
  { href: '/dashboard/strategy', label: '전략', icon: LineChart },
]

const moreLinks = [
  { href: '/dashboard/upload', label: '데이터 업로드', icon: Upload },
  { href: '/', label: '랜딩으로' },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="모바일 하단 메뉴"
      >
        <ul className="grid grid-cols-4">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.href, tab.exact)
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium',
                    active ? 'text-brand' : 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn('h-5 w-5', active && 'text-brand')} />
                  {tab.label}
                </Link>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex w-full flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium',
                moreOpen || pathname?.startsWith('/dashboard/upload')
                  ? 'text-brand'
                  : 'text-muted-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              더보기
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[50vh] p-0 md:max-h-[50vh] md:w-full md:max-w-none">
          <SheetHeader>
            <SheetTitle>더보기</SheetTitle>
          </SheetHeader>
          <ul className="space-y-1 px-3 py-3">
            {moreLinks.map((link) => {
              const Icon = 'icon' in link ? link.icon : undefined
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  )
}
