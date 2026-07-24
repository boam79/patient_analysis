'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardInsight } from '@/lib/utils/dashboard-insight'
import { Button } from '@/components/ui/button'

interface InsightBannerProps {
  insight: DashboardInsight
  onCta?: () => void
  className?: string
}

export function InsightBanner({ insight, onCta, className }: InsightBannerProps) {
  const cta = insight.ctaLabel ? (
    insight.ctaHref?.startsWith('#') || onCta ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 shrink-0 gap-1 text-brand"
        onClick={() => {
          if (onCta) onCta()
          if (insight.ctaHref?.startsWith('#')) {
            document.querySelector(insight.ctaHref)?.scrollIntoView({ behavior: 'smooth' })
          }
        }}
      >
        {insight.ctaLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    ) : insight.ctaHref ? (
      <Button asChild variant="ghost" size="sm" className="h-8 shrink-0 gap-1 text-brand">
        <Link href={insight.ctaHref}>
          {insight.ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    ) : null
  ) : null

  return (
    <div
      className={cn(
        'animate-fade-up flex flex-col gap-2 rounded-lg border border-primary/20 bg-accent/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold leading-snug text-brand-ink md:text-base">
          {insight.headline}
        </p>
        {insight.detail ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{insight.detail}</p>
        ) : null}
      </div>
      {cta}
    </div>
  )
}
