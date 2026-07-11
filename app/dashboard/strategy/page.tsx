'use client'

import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFilterStore } from '@/stores/filter-store'
import { useDataStore } from '@/stores/data-store'
import { Users, MapPin, Calendar, Target, BarChart3, AlertTriangle, Activity } from 'lucide-react'
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

  const {
    rawData,
    isDataLoaded,
  } = useDataStore()

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
  }, [isDataLoaded, rawData, selectedDiseases, selectedRegions, selectedSurgeries, ageGroups, genders, dateRange])

  return (
    <div className="container mx-auto px-4 py-6 space-y-6" id="strategy-main">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">경영·마케팅 전략 분석</h1>
          <p className="text-sm text-muted-foreground mt-2">
            병원 CRM 데이터 기반 경영·마케팅 전략 수립을 위한 심화 분석
            {usingSample
              ? ` (샘플 데이터 · ${SAMPLE_DATE_RANGE_LABEL})`
              : ' (실제 데이터)'}
            {' · '}재방문 윈도우 {windowSize}일
            {filteredData.length === 0 ? ' · 필터 결과 없음' : ` · ${filteredData.length}건`}
          </p>
        </div>
      </div>

      <ManagementInsights data={filteredData} windowSize={windowSize} />

      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto justify-start">
          <TabsTrigger value="executive" className="flex items-center gap-1 text-xs">
            <BarChart3 className="h-3 w-3" />경영 요약
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />유입·유지
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3" />지역 시장
          </TabsTrigger>
          <TabsTrigger value="clinical" className="flex items-center gap-1 text-xs">
            <Activity className="h-3 w-3" />질병·수술·연관
          </TabsTrigger>
          <TabsTrigger value="segment" className="flex items-center gap-1 text-xs">
            <Target className="h-3 w-3" />세그먼트
          </TabsTrigger>
          <TabsTrigger value="timeseries" className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />시계열·예측
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1 text-xs">
            <AlertTriangle className="h-3 w-3" />이상·고급
          </TabsTrigger>
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
          <RegionalMarketAnalysis data={filteredData} />
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
