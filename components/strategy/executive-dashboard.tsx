'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { PatientData } from '@/stores/data-store'
import { resolvePatientId } from '@/lib/utils/patient-identity'
import {
  computeRetentionSummary,
  computeMonthlyUniquePatientGrowth,
  DEFAULT_STRATEGY_WINDOW,
} from '@/lib/utils/strategy-metrics'
import { MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExecutiveDashboardProps {
  data: PatientData[]
  windowSize?: number
}

export function ExecutiveDashboard({
  data,
  windowSize = DEFAULT_STRATEGY_WINDOW,
}: ExecutiveDashboardProps) {
  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalVisits: 0,
        uniquePatients: 0,
        newPatients: 0,
        returningPatients: 0,
        retentionRate: 0,
        topRegions: [] as { region: string; count: number }[],
        topDiseases: [] as { disease: string; count: number }[],
        growthRate: 0,
        avgVisitsPerPatient: 0,
      }
    }

    const retention = computeRetentionSummary(data, windowSize)
    const uniquePatients = retention.uniquePatients
    const avgVisitsPerPatient =
      uniquePatients > 0 ? data.length / uniquePatients : 0

    const regionPatients = new Map<string, Set<string>>()
    data.forEach((p) => {
      if (p.region) {
        const key = resolvePatientId(p)
        if (!regionPatients.has(p.region)) {
          regionPatients.set(p.region, new Set())
        }
        regionPatients.get(p.region)!.add(key)
      }
    })
    const topRegions = Array.from(regionPatients.entries())
      .map(([region, patients]) => ({ region, count: patients.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const diseasePatients = new Map<string, Set<string>>()
    data.forEach((p) => {
      if (p.disease_name) {
        const key = resolvePatientId(p)
        if (!diseasePatients.has(p.disease_name)) {
          diseasePatients.set(p.disease_name, new Set())
        }
        diseasePatients.get(p.disease_name)!.add(key)
      }
    })
    const topDiseases = Array.from(diseasePatients.entries())
      .map(([disease, patients]) => ({ disease, count: patients.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const growthRate = computeMonthlyUniquePatientGrowth(data)

    return {
      totalVisits: data.length,
      uniquePatients,
      newPatients: retention.newPatients,
      returningPatients: retention.returningPatients,
      retentionRate: retention.retentionRate,
      topRegions,
      topDiseases,
      growthRate,
      avgVisitsPerPatient,
    }
  }, [data, windowSize])

  return (
    <div className="space-y-8">
      <section>
        <h2 className="section-heading">핵심 지표</h2>
        <p className="section-lead">
          필터·재방문 윈도우 {windowSize}일 기준 요약
        </p>
        <div className="metric-strip mt-3 animate-kpi-in">
          <div className="metric-strip-item">
            <span className="metric-strip-label">총 방문</span>
            <span className="metric-strip-value">
              {metrics.totalVisits.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">
              고유 {metrics.uniquePatients.toLocaleString()}명
            </span>
          </div>
          <div className="metric-strip-item">
            <span className="metric-strip-label">재방문율</span>
            <span className="metric-strip-value">
              {metrics.retentionRate.toFixed(1)}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              재방문 {metrics.returningPatients} · 신규 {metrics.newPatients}
            </span>
          </div>
          <div className="metric-strip-item">
            <span className="metric-strip-label">환자당 평균 방문</span>
            <span className="metric-strip-value">
              {metrics.avgVisitsPerPatient.toFixed(1)}
            </span>
            <span className="text-[11px] text-muted-foreground">회</span>
          </div>
          <div className="metric-strip-item">
            <span className="metric-strip-label">성장률 (MoM)</span>
            <span
              className={cn(
                'metric-strip-value',
                metrics.growthRate >= 0 ? 'text-positive' : 'text-destructive'
              )}
            >
              {metrics.growthRate >= 0 ? '+' : ''}
              {metrics.growthRate.toFixed(1)}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              전월 대비 고유 환자
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="section-heading flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand" />
                주요 지역 Top 5
              </h2>
              <p className="section-lead">고유 환자 기준</p>
            </div>
            <Link
              href="/dashboard/map?tab=distribution"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              지도에서 보기
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2.5 border border-border bg-card/50 p-3">
            {metrics.topRegions.length > 0 ? (
              metrics.topRegions.map((item, index) => (
                <div
                  key={item.region}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {item.region}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="hidden h-1.5 w-24 overflow-hidden bg-muted sm:block">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(item.count / metrics.topRegions[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-semibold tabular-nums">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="section-heading">주요 질병 Top 5</h2>
          <p className="section-lead mb-3">고유 환자 기준</p>
          <div className="space-y-2.5 border border-border bg-card/50 p-3">
            {metrics.topDiseases.length > 0 ? (
              metrics.topDiseases.map((item, index) => (
                <div
                  key={item.disease}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {item.disease}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="hidden h-1.5 w-24 overflow-hidden bg-muted sm:block">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(item.count / metrics.topDiseases[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-semibold tabular-nums">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
