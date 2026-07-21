import { cn } from '@/lib/utils'

export interface MetricItem {
  label: string
  value: React.ReactNode
  hint?: string
  accent?: 'default' | 'warning' | 'danger'
}

interface MetricStripProps {
  items: MetricItem[]
  className?: string
}

const COLS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
}

/** 카드 중첩 없이 KPI를 한 줄/격자로 보여주는 메트릭 스트립 */
export function MetricStrip({ items, className }: MetricStripProps) {
  const colClass = COLS[Math.min(5, Math.max(1, items.length))] ?? 'sm:grid-cols-4'

  return (
    <div
      className={cn(
        'grid divide-y divide-border/70 overflow-hidden rounded-lg border border-border/80 bg-card/80 sm:divide-x sm:divide-y-0',
        colClass,
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
          <p
            className={cn(
              'mt-1 font-display text-2xl font-bold tabular-nums tracking-tight',
              item.accent === 'warning' && 'text-warning',
              item.accent === 'danger' && 'text-destructive',
              (!item.accent || item.accent === 'default') && 'text-brand-ink'
            )}
          >
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
