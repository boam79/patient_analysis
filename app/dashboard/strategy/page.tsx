'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFilterStore } from '@/stores/filter-store'
import { useDataStore } from '@/stores/data-store'
import {
  Users,
  MapPin,
  Calendar,
  Target,
  BarChart3,
  AlertTriangle,
  Activity,
  ExternalLink,
} from 'lucide-react'
import { filterPatients } from '@/lib/utils/patient-filters'
import {
  SAMPLE_DATE_RANGE_LABEL,
  resolveAnalysisData,
  isUsingSampleData,
} from '@/lib/sample-data'

import { PatientFlowAnalysis } from '@/components/strategy/patient-flow-analysis'
import { RegionalMarketAnalysis } from '@/components/strategy/regional-market-analysis'
import { DiseaseSurgeryStrategy } from '@/components/strategy/disease-surgery-strategy'
import { CustomerSegmentAnalysis } from '@/components/strategy/customer-segment-analysis'
import { TrendAnalysis } from '@/components/strategy/trend-analysis'
import { ExecutiveDashboard } from '@/components/strategy/executive-dashboard'
import { ManagementInsights } from '@/components/strategy/management-insights'
import { CohortAnalysis } from '@/components/strategy/cohort-analysis'
import { RfmAnalysis } from '@/components/strategy/rfm-analysis'
import { AssociationAnalysis } from '@/components/strategy/association-analysis'
import { SeasonalForecast } from '@/components/strategy/seasonal-forecast'
import { AnomalyDetection } from '@/components/strategy/anomaly-detection'
import { PatientJourney } from '@/components/strategy/patient-journey'
import { AdvancedStatisticsTab } from '@/components/strategy/advanced-statistics-tab'

const RETENTION_ANCHORS = [
  { id: 'flow', label: '유입·유지' },
  { id: 'rfm', label: 'RFM' },
  { id: 'cohort', label: '코호트' },
  { id: 'journey', label: '여정' },
] as const

export default function StrategyPage() {
  const {
    selectedDiseases,
    selectedRegions,
    selectedSurgeries,
    ageGroups,
    genders,
    dateRange,
    windowSize,
  } = useFilterStore()

  const { rawData, isDataLoaded } = useDataStore()

  const usingSample = isUsingSampleData(isDataLoaded, rawData)

  const filteredData = useMemo(() => {
    const baseData = resolveAnalysisData(isDataLoaded, rawData)
    if (baseData.length === 0) return []

    return filterPatients(baseData, {
      selectedDiseases,
      selectedRegions,
      selectedSurgeries,
      ageGroups,
      genders: genders as ('남성' | '여성')[],
      dateRange,
    })
  }, [
    isDataLoaded,
    rawData,
    selectedDiseases,
    selectedRegions,
    selectedSurgeries,
    ageGroups,
    genders,
    dateRange,
  ])

  return (
    <div className="container mx-auto space-y-8 px-4 py-6" id="strategy-main">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          경영·마케팅 전략 분석
        </h1>
        <p className="text-sm text-muted-foreground">
          {usingSample
            ? `샘플 · ${SAMPLE_DATE_RANGE_LABEL}`
            : '실제 데이터'}
          {' · '}재방문 윈도우 {windowSize}일
          {filteredData.length === 0
            ? ' · 필터 결과 없음'
            : ` · ${filteredData.length.toLocaleString()}건`}
        </p>
      </header>

      <ManagementInsights data={filteredData} windowSize={windowSize} />

      <Tabs defaultValue="executive" className="w-full">
        <div className="tabs-scroll border-b border-border">
          <TabsList className="inline-flex h-auto w-max justify-start gap-0 rounded-none bg-transparent p-0">
            {(
              [
                { value: 'executive', icon: BarChart3, label: '경영 요약' },
                { value: 'retention', icon: Users, label: '유입·유지' },
                { value: 'regional', icon: MapPin, label: '지역 시장' },
                { value: 'clinical', icon: Activity, label: '질병·수술·연관' },
                { value: 'segment', icon: Target, label: '세그먼트' },
                { value: 'timeseries', icon: Calendar, label: '시계열·예측' },
                { value: 'advanced', icon: AlertTriangle, label: '이상·고급' },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-brand data-[state=active]:shadow-none"
              >
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="executive" className="mt-6">
          <ExecutiveDashboard data={filteredData} windowSize={windowSize} />
        </TabsContent>

        <TabsContent value="retention" className="mt-6 space-y-10">
          <nav
            className="flex flex-wrap gap-2 text-xs"
            aria-label="유입·유지 섹션"
          >
            {RETENTION_ANCHORS.map((a) => (
              <a
                key={a.id}
                href={`#retention-${a.id}`}
                className="border border-border bg-card px-2.5 py-1 text-muted-foreground hover:border-primary hover:text-brand"
              >
                {a.label}
              </a>
            ))}
          </nav>
          <div id="retention-flow">
            <h2 className="section-heading">유입·유지 흐름</h2>
            <p className="section-lead mb-4">
              방문 횟수·재방문·이탈 패턴
            </p>
            <PatientFlowAnalysis data={filteredData} windowSize={windowSize} />
          </div>
          <div id="retention-rfm">
            <h2 className="section-heading">RFM 세그먼트</h2>
            <p className="section-lead mb-4">최근성·빈도·가치 기반 고객 분류</p>
            <RfmAnalysis data={filteredData} />
          </div>
          <div id="retention-cohort">
            <h2 className="section-heading">코호트</h2>
            <p className="section-lead mb-4">첫 방문 월 기준 유지율</p>
            <CohortAnalysis data={filteredData} />
          </div>
          <div id="retention-journey">
            <h2 className="section-heading">환자 여정</h2>
            <p className="section-lead mb-4">방문 단계별 전환</p>
            <PatientJourney data={filteredData} />
          </div>
        </TabsContent>

        <TabsContent value="regional" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="section-heading">지역 시장</h2>
              <p className="section-lead">점유·성장·유입 지역 비교</p>
            </div>
            <Link
              href="/dashboard/map?tab=distribution"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              지도에서 보기
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <RegionalMarketAnalysis data={filteredData} />
        </TabsContent>

        <TabsContent value="clinical" className="mt-6 space-y-10">
          <div>
            <h2 className="section-heading">질병·수술 전략</h2>
            <p className="section-lead mb-4">질환·시술 구성과 재방문</p>
            <DiseaseSurgeryStrategy
              data={filteredData}
              windowSize={windowSize}
            />
          </div>
          <div>
            <h2 className="section-heading">연관 분석</h2>
            <p className="section-lead mb-4">질병×수술 Lift</p>
            <AssociationAnalysis data={filteredData} />
          </div>
        </TabsContent>

        <TabsContent value="segment" className="mt-6">
          <h2 className="section-heading">고객 세그먼트</h2>
          <p className="section-lead mb-4">연령·성별·고가치 고객</p>
          <CustomerSegmentAnalysis data={filteredData} />
        </TabsContent>

        <TabsContent value="timeseries" className="mt-6 space-y-10">
          <div>
            <h2 className="section-heading">시기별 트렌드</h2>
            <p className="section-lead mb-4">월·분기·계절·요일</p>
            <TrendAnalysis data={filteredData} />
          </div>
          <div>
            <h2 className="section-heading">계절성·단기 예측</h2>
            <p className="section-lead mb-4">계절지수와 전망</p>
            <SeasonalForecast data={filteredData} />
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="mt-6 space-y-10">
          <div>
            <h2 className="section-heading">이상 탐지</h2>
            <p className="section-lead mb-4">급증·급감 패턴</p>
            <AnomalyDetection data={filteredData} />
          </div>
          <div>
            <h2 className="section-heading">고급 통계</h2>
            <p className="section-lead mb-4">가설검정·생존·군집</p>
            <AdvancedStatisticsTab data={filteredData} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
