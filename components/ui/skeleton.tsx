import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

/** 로딩 스켈레톤 — muted 표면 + 약한 pulse */
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted/80', className)}
      aria-hidden
      {...props}
    />
  )
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex h-[280px] flex-col justify-end gap-2 p-4', className)}
      role="status"
      aria-label="차트 로딩 중"
    >
      <Skeleton className="h-[40%] w-[12%]" />
      <div className="flex items-end gap-2">
        <Skeleton className="h-[55%] w-[14%]" />
        <Skeleton className="h-[70%] w-[14%]" />
        <Skeleton className="h-[45%] w-[14%]" />
        <Skeleton className="h-[80%] w-[14%]" />
        <Skeleton className="h-[50%] w-[14%]" />
        <Skeleton className="h-[65%] w-[14%]" />
      </div>
      <span className="sr-only">차트 로딩 중</span>
    </div>
  )
}
