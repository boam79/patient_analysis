'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FilterPanel } from '@/components/filter/filter-panel'
import { useFilterStore } from '@/stores/filter-store'
import { PatientData, useDataStore } from '@/stores/data-store'
import { TrendingUp, Users, MapPin, Calendar, Target, BarChart3 } from 'lucide-react'

// 분석 컴포넌트들 (추가 예정)
import { PatientFlowAnalysis } from '@/components/strategy/patient-flow-analysis'
import { RegionalMarketAnalysis } from '@/components/strategy/regional-market-analysis'
import { DiseaseSurgeryStrategy } from '@/components/strategy/disease-surgery-strategy'
import { CustomerSegmentAnalysis } from '@/components/strategy/customer-segment-analysis'
import { TrendAnalysis } from '@/components/strategy/trend-analysis'
import { PredictionAnalysis } from '@/components/strategy/prediction-analysis'
import { ExecutiveDashboard } from '@/components/strategy/executive-dashboard'

export default function StrategyPage() {
  const {
    selectedDiseases,
    selectedRegions,
    selectedSurgeries,
    ageGroups,
    genders,
    dateRange,
  } = useFilterStore()
  
  const { 
    rawData,
    isDataLoaded,
  } = useDataStore()

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    
    return rawData.filter((patient: PatientData) => {
      // 질병 필터
      if (selectedDiseases.length > 0 && !selectedDiseases.includes(patient.disease_name)) {
        return false
      }
      
      // 지역 필터
      if (selectedRegions.length > 0 && !selectedRegions.includes(patient.region)) {
        return false
      }
      
      // 수술 필터
      if (selectedSurgeries.length > 0) {
        if (!patient.surgery_name || !selectedSurgeries.includes(patient.surgery_name)) {
          return false
        }
      }
      
      // 연령대 필터
      if (ageGroups.length > 0) {
        const ageGroup = getAgeGroup(patient.age)
        if (!ageGroups.includes(ageGroup)) {
          return false
        }
      }
      
      // 성별 필터
      if (genders.length > 0) {
        const patientGender = normalizeGender(patient.gender)
        if (!genders.includes(patientGender as '남성' | '여성')) {
          return false
        }
      }
      
      // 날짜 필터
      if (dateRange.start && dateRange.end) {
        const visitDate = parseDate(patient.visit_date)
        const startDate = parseDate(dateRange.start)
        const endDate = parseDate(dateRange.end)
        
        if (!visitDate || !startDate || !endDate) {
          return false
        }
        
        if (visitDate < startDate || visitDate > endDate) {
          return false
        }
      }
      
      return true
    })
  }, [rawData, selectedDiseases, selectedRegions, selectedSurgeries, ageGroups, genders, dateRange])

  return (
    <div className="container mx-auto px-4 py-6 space-y-6" id="strategy-main">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">경영·마케팅 전략 분석</h1>
          <p className="text-sm text-muted-foreground mt-2">
            환자 데이터 기반 경영전략 및 마케팅 전략 수립을 위한 심화 분석
            {isDataLoaded ? ' (실제 데이터)' : ' (샘플 데이터)'}
          </p>
        </div>
      </div>

      {/* 필터 패널 */}
      <FilterPanel />

      {/* 전략 분석 탭 */}
      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="executive" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            경영 대시보드
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            환자 유입/유지
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            지역별 시장
          </TabsTrigger>
          <TabsTrigger value="disease" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            질병/수술 전략
          </TabsTrigger>
          <TabsTrigger value="segment" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            고객 세그먼트
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            시기별 트렌드
          </TabsTrigger>
          <TabsTrigger value="prediction" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            예측 분석
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="mt-6">
          <ExecutiveDashboard data={filteredData} />
        </TabsContent>

        <TabsContent value="flow" className="mt-6">
          <PatientFlowAnalysis data={filteredData} />
        </TabsContent>

        <TabsContent value="regional" className="mt-6">
          <RegionalMarketAnalysis data={filteredData} />
        </TabsContent>

        <TabsContent value="disease" className="mt-6">
          <DiseaseSurgeryStrategy data={filteredData} />
        </TabsContent>

        <TabsContent value="segment" className="mt-6">
          <CustomerSegmentAnalysis data={filteredData} />
        </TabsContent>

        <TabsContent value="trend" className="mt-6">
          <TrendAnalysis data={filteredData} />
        </TabsContent>

        <TabsContent value="prediction" className="mt-6">
          <PredictionAnalysis data={filteredData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { getAgeGroup, normalizeGender } from '@/lib/utils/patient-helpers'
import { extractMonth, parseDate } from '@/lib/utils/date-helpers'

