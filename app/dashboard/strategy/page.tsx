'use client'

import { useMemo, useState } from 'react'
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
} from 'lucide-react'
import { filterPatients } from '@/lib/utils/patient-filters'
import {
  SAMPLE_DATE_RANGE_LABEL,
  resolveAnalysisData,
  isUsingSampleData,
} from '@/lib/sample-data'
import { PageHeader } from '@/components/layout/page-header'
import { FilterChipBar } from '@/components/filter/filter-chip-bar'
import { MetricGlossary } from '@/components/layout/metric-glossary'

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

const STRATEGY_TABS = [
  { value: 'executive', label: '경영 요약', icon: BarChart3 },
  { value: 'retention', label: '유입·유지', icon: Users },
  { value: 'regional', label: '지역 시장', icon: MapPin },
  { value: 'clinical', label: '질병·수술·연관', icon: Activity },
  { value: 'segment', label: '세그먼트', icon: Target },
  { value: 'timeseries', label: '시계열·예측', icon: Calendar },
  { value: 'advanced', label: '이상·고급', icon: AlertTriangle },
] as const

type TabValue = (typeof STRATEGY_TABS)[number]['value']

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
  const [tab, setTab] = useState<TabValue>('executive')

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

  const description = [
    '병원 CRM 데이터 기반 경영·마케팅 전략 수립을 위한 심화 분석',
    usingSample
      ? `샘플 데이터 · ${SAMPLE_DATE_RANGE_LABEL}`
      : '실제 데이터',
    `재방문 윈도우 ${windowSize}일`,
    filteredData.length === 0
      ? '필터 결과 없음'
      : `${filteredData.length}건`,
  ].join(' · ')

  return (
    <div className="container mx-auto space-y-4 px-4 py-4 md:space-y-6 md:py-6" id="strategy-main">
      <FilterChipBar />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PageHeader title="경영·마케팅 전략 분석" description={description} />
        <MetricGlossary />
      </div>

      <ManagementInsights data={filteredData} windowSize={windowSize} />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
        className="w-full"
      >
        {/* Mobile: select */}
        <div className="md:hidden">
          <label htmlFor="strategy-tab" className="sr-only">
            전략 분석 탭
          </label>
          <select
            id="strategy-tab"
            value={tab}
            onChange={(e) => setTab(e.target.value as TabValue)}
            className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground"
          >
            {STRATEGY_TABS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop: tabs */}
        <TabsList className="hidden h-auto flex-wrap justify-start gap-1 md:flex">
          {STRATEGY_TABS.map((t) => {
            const Icon = t.icon
            return (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="flex items-center gap-1 text-xs"
              >
                <Icon className="h-3 w-3" />
                {t.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="executive" className="mt-6">
          <ExecutiveDashboard data={filteredData} windowSize={windowSize} />
        </TabsContent>

        <TabsContent value="retention" className="mt-6 space-y-8">
          <PatientFlowAnalysis data={filteredData} windowSize={windowSize} />
          <RfmAnalysis data={filteredData} />
          <CohortAnalysis data={filteredData} />
          <PatientJourney data={filteredData} />
        </TabsContent>

        <TabsContent value="regional" className="mt-6">
          <RegionalMarketAnalysis data={filteredData} windowSize={windowSize} />
        </TabsContent>

        <TabsContent value="clinical" className="mt-6 space-y-8">
          <DiseaseSurgeryStrategy data={filteredData} windowSize={windowSize} />
          <AssociationAnalysis data={filteredData} />
        </TabsContent>

        <TabsContent value="segment" className="mt-6">
          <CustomerSegmentAnalysis data={filteredData} />
        </TabsContent>

        <TabsContent value="timeseries" className="mt-6 space-y-8">
          <TrendAnalysis data={filteredData} />
          <SeasonalForecast data={filteredData} />
        </TabsContent>

        <TabsContent value="advanced" className="mt-6 space-y-8">
          <AnomalyDetection data={filteredData} />
          <AdvancedStatisticsTab data={filteredData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
