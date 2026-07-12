'use client'

import { useMemo, useState } from 'react'
import { PatientData } from '@/stores/data-store'
import { DEFAULT_STRATEGY_WINDOW } from '@/lib/utils/strategy-metrics'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'
import {
  buildManagementInsights,
  type InsightCategory,
} from '@/lib/utils/management-insights'
import { INSIGHT_SOURCES } from '@/lib/utils/management-insight-benchmarks'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ManagementInsightsProps {
  data: PatientData[]
  windowSize?: number
}

const PRIORITY_COUNT = 3

function iconFor(category: InsightCategory) {
  switch (category) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-destructive" />
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-warning" />
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-positive" />
    default:
      return <Info className="h-4 w-4 text-info" />
  }
}

function rowClass(category: InsightCategory) {
  switch (category) {
    case 'critical':
      return 'insight-row insight-row-critical'
    case 'warning':
      return 'insight-row insight-row-warning'
    case 'success':
      return 'insight-row insight-row-success'
    default:
      return 'insight-row insight-row-info'
  }
}

/**
 * 경영 인사이트 — Insight Brief: 우선 3건 + 접기, Harbor accent bar.
 */
export function ManagementInsights({
  data,
  windowSize = DEFAULT_STRATEGY_WINDOW,
}: ManagementInsightsProps) {
  const [expanded, setExpanded] = useState(false)

  const insights = useMemo(
    () => buildManagementInsights(data, windowSize),
    [data, windowSize]
  )

  if (insights.length === 0) {
    return null
  }

  const evidenceLabel = {
    official: '공적 근거',
    literature: '문헌·사례',
    operational: '운영 휴리스틱',
  } as const

  const visible = expanded ? insights : insights.slice(0, PRIORITY_COUNT)
  const hiddenCount = Math.max(0, insights.length - PRIORITY_COUNT)

  return (
    <section className="space-y-3" aria-labelledby="insights-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="insights-heading" className="section-heading">
            경영 인사이트
          </h2>
          <p className="section-lead">
            우선 {Math.min(PRIORITY_COUNT, insights.length)}건 · 전체{' '}
            {insights.length}개 · 윈도우 {windowSize}일
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {visible.map((insight, index) => (
          <article
            key={insight.id}
            className={cn(
              rowClass(insight.category),
              index === 0 && 'animate-fade-up'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{iconFor(insight.category)}</div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {insight.title}
                  </h3>
                  <span className="evidence-badge">
                    {evidenceLabel[insight.evidenceLevel]}
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    신뢰도 {insight.confidence}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
                <p className="border-l-2 border-border pl-2 text-xs text-muted-foreground">
                  {insight.statisticalBasis}
                </p>
                {insight.recommendations &&
                  insight.recommendations.length > 0 && (
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-foreground/90">
                      {insight.recommendations.map((rec) => (
                        <li key={rec}>{rec}</li>
                      ))}
                    </ul>
                  )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {hiddenCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1 h-4 w-4" />
              접기
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-4 w-4" />
              나머지 {hiddenCount}건 펼치기
            </>
          )}
        </Button>
      )}

      <details className="border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">
          근거 사용 원칙
        </summary>
        <div className="mt-2 space-y-2">
          <p>
            재방문율·성장률·수술 방문 비중 등은{' '}
            <strong>본 데이터의 정의</strong>와 <strong>운영 경보선</strong>
            으로 판단합니다. 공적 통계는 배경·지정 기준 안내용으로만
            인용하며, 지표 정의가 다르면 직접 비교하지 않습니다.
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>{INSIGHT_SOURCES.specialtyHospitalRule.label}</li>
            <li>{INSIGHT_SOURCES.mohwSpecialty2024.label}</li>
            <li>{INSIGHT_SOURCES.kostatElderly2023.label}</li>
            <li>{INSIGHT_SOURCES.oecdOutpatient2023.label}</li>
            <li>{INSIGHT_SOURCES.hiraSpineClinicalMonitor.label}</li>
          </ul>
        </div>
      </details>
    </section>
  )
}
