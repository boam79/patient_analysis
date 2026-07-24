'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { DEFAULT_STRATEGY_WINDOW } from '@/lib/utils/strategy-metrics'
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Users,
  MapPin,
  Target,
  Lightbulb,
  BarChart3,
  Activity,
  Info,
} from 'lucide-react'
import {
  buildManagementInsights,
  type InsightCategory,
} from '@/lib/utils/management-insights'
import { INSIGHT_SOURCES, confidenceLabel } from '@/lib/utils/management-insight-benchmarks'
import { isUsingSampleData } from '@/lib/sample-data'
import { useDataStore } from '@/stores/data-store'

interface ManagementInsightsProps {
  data: PatientData[]
  windowSize?: number
}

function iconFor(category: InsightCategory) {
  switch (category) {
    case 'critical':
      return <AlertCircle className="h-5 w-5 text-red-600" />
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-yellow-600" />
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    default:
      return <Info className="h-5 w-5 text-blue-600" />
  }
}

/**
 * 경영 인사이트 — 측정 가능한 CRM 지표 + 근거 수준 명시.
 * 공적 평가 수치를 임의로 붙여 쓰지 않음.
 */
export function ManagementInsights({
  data,
  windowSize = DEFAULT_STRATEGY_WINDOW,
}: ManagementInsightsProps) {
  const { isDataLoaded, rawData } = useDataStore()
  const usingSample = isUsingSampleData(isDataLoaded, rawData)

  const insights = useMemo(
    () => buildManagementInsights(data, windowSize),
    [data, windowSize]
  )

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            경영 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {data.length === 0
              ? '필터 결과가 없어 인사이트를 생성할 수 없습니다.'
              : '현재 조건에서 생성할 인사이트가 없습니다.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const categoryStyles: Record<InsightCategory, string> = {
    critical: 'border-red-200 bg-red-50/50',
    warning: 'border-yellow-200 bg-yellow-50/50',
    info: 'border-blue-200 bg-blue-50/50',
    success: 'border-green-200 bg-green-50/50',
  }

  const evidenceLabel = {
    official: '공적 근거',
    literature: '문헌·사례',
    operational: '운영 휴리스틱',
  } as const

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          경영 인사이트
          <span className="text-sm font-normal text-muted-foreground">
            ({insights.length}개 · 윈도우 {windowSize}일)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-lg border p-4 ${categoryStyles[insight.category]}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{iconFor(insight.category)}</div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{insight.title}</h3>
                  <span className="text-xs rounded-full bg-background/80 px-2 py-0.5 text-muted-foreground">
                    {evidenceLabel[insight.evidenceLevel]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {confidenceLabel(insight.confidence)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                {usingSample ? (
                  <p className="text-xs text-warning">
                    샘플 데이터(재방문 간격 대략 14–120일) 기준 · 실데이터와 수치가 다를 수 있음
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground border-l-2 border-muted pl-2">
                  {insight.statisticalBasis}
                </p>
                {insight.recommendations && insight.recommendations.length > 0 && (
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    {insight.recommendations.map((rec) => (
                      <li key={rec}>{rec}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">근거 사용 원칙</p>
          <p>
            재방문율·성장률·수술 방문 비중 등은 <strong>본 데이터의 정의</strong>와
            <strong> 운영 경보선</strong>으로 판단합니다. 공적 통계는 배경·지정 기준
            안내용으로만 인용하며, 지표 정의가 다르면 직접 비교하지 않습니다.
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>{INSIGHT_SOURCES.specialtyHospitalRule.label}</li>
            <li>{INSIGHT_SOURCES.mohwSpecialty2024.label}</li>
            <li>{INSIGHT_SOURCES.kostatElderly2023.label}</li>
            <li>{INSIGHT_SOURCES.oecdOutpatient2023.label}</li>
            <li>{INSIGHT_SOURCES.hiraSpineClinicalMonitor.label}</li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-1 text-muted-foreground/80">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> 윈도우 재방문
            </span>
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> MoM 성장
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> 지역 HHI
            </span>
            <span className="inline-flex items-center gap-1">
              <Target className="h-3 w-3" /> 수술 방문 비중
            </span>
            <span className="inline-flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> 질환 구성
            </span>
            <span className="inline-flex items-center gap-1">
              <Activity className="h-3 w-3" /> 추세
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
