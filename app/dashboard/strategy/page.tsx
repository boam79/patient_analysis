'use client'

import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFilterStore } from '@/stores/filter-store'
import { PatientData, useDataStore } from '@/stores/data-store'
import { Users, MapPin, Calendar, Target, BarChart3, AlertTriangle, Activity } from 'lucide-react'
import { filterPatients } from '@/lib/utils/patient-filters'

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

// 샘플 데이터 (실제 데이터가 없을 때 사용)
const SAMPLE_PATIENT_DATA: PatientData[] = [
  { patient_id: 'patient_001', name: '홍길동', visit_date: '2024-01-15', age: 45, gender: '남성', disease_code: 'M25.5', disease_name: '무릎관절증', surgery_name: '무릎관절경수술', address: '서울특별시 강남구 테헤란로 123', region: '서울 강남구' },
  { patient_id: 'patient_002', name: '김영희', visit_date: '2024-01-20', age: 52, gender: '여성', disease_code: 'M54.5', disease_name: '척추관협착증', surgery_name: '척추유합술', address: '서울특별시 서초구 서초대로 456', region: '서울 서초구' },
  { patient_id: 'patient_003', name: '이철수', visit_date: '2024-02-10', age: 38, gender: '남성', disease_code: 'I10', disease_name: '본태성 고혈압', address: '서울특별시 송파구 올림픽로 789', region: '서울 송파구' },
  { patient_id: 'patient_001', name: '홍길동', visit_date: '2024-03-05', age: 45, gender: '남성', disease_code: 'M25.5', disease_name: '무릎관절증', address: '서울특별시 강남구 테헤란로 123', region: '서울 강남구' },
  { patient_id: 'patient_004', name: '박민수', visit_date: '2024-02-15', age: 61, gender: '남성', disease_code: 'M75.1', disease_name: '어깨충돌증후군', surgery_name: '어깨관절경수술', address: '경기도 성남시 분당구 정자로 321', region: '경기 성남시' },
  { patient_id: 'patient_005', name: '최지은', visit_date: '2024-02-20', age: 48, gender: '여성', disease_code: 'M51.2', disease_name: '요추추간판장애', address: '서울특별시 마포구 홍대로 654', region: '서울 마포구' },
  { patient_id: 'patient_002', name: '김영희', visit_date: '2024-03-10', age: 52, gender: '여성', disease_code: 'M54.5', disease_name: '척추관협착증', address: '서울특별시 서초구 서초대로 456', region: '서울 서초구' },
  { patient_id: 'patient_006', name: '정수진', visit_date: '2024-03-15', age: 55, gender: '여성', disease_code: 'M80.0', disease_name: '골다공증', address: '서울특별시 강동구 천호대로 987', region: '서울 강동구' },
  { patient_id: 'patient_007', name: '강호영', visit_date: '2024-03-20', age: 42, gender: '남성', disease_code: 'E11.9', disease_name: '당뇨병', address: '경기도 고양시 일산동구 정발산로 147', region: '경기 고양시' },
  { patient_id: 'patient_003', name: '이철수', visit_date: '2024-04-05', age: 38, gender: '남성', disease_code: 'I10', disease_name: '본태성 고혈압', address: '서울특별시 송파구 올림픽로 789', region: '서울 송파구' },
  { patient_id: 'patient_008', name: '윤서연', visit_date: '2024-04-10', age: 49, gender: '여성', disease_code: 'M25.5', disease_name: '무릎관절증', surgery_name: '무릎관절경수술', address: '서울특별시 강남구 테헤란로 258', region: '서울 강남구' },
  { patient_id: 'patient_009', name: '장민호', visit_date: '2024-04-15', age: 58, gender: '남성', disease_code: 'M54.5', disease_name: '척추관협착증', address: '서울특별시 서초구 서초대로 369', region: '서울 서초구' },
  { patient_id: 'patient_001', name: '홍길동', visit_date: '2024-05-01', age: 45, gender: '남성', disease_code: 'M25.5', disease_name: '무릎관절증', address: '서울특별시 강남구 테헤란로 123', region: '서울 강남구' },
  { patient_id: 'patient_010', name: '한소영', visit_date: '2024-05-05', age: 44, gender: '여성', disease_code: 'M75.1', disease_name: '어깨충돌증후군', address: '경기도 용인시 기흥구 신갈로 741', region: '경기 용인시' },
  { patient_id: 'patient_011', name: '오대현', visit_date: '2024-05-10', age: 56, gender: '남성', disease_code: 'M51.2', disease_name: '요추추간판장애', surgery_name: '척추유합술', address: '서울특별시 마포구 홍대로 852', region: '서울 마포구' },
  { patient_id: 'patient_004', name: '박민수', visit_date: '2024-05-15', age: 61, gender: '남성', disease_code: 'M75.1', disease_name: '어깨충돌증후군', address: '경기도 성남시 분당구 정자로 321', region: '경기 성남시' },
  { patient_id: 'patient_012', name: '임지훈', visit_date: '2024-05-20', age: 47, gender: '남성', disease_code: 'I10', disease_name: '본태성 고혈압', address: '서울특별시 송파구 올림픽로 963', region: '서울 송파구' },
  { patient_id: 'patient_013', name: '신미라', visit_date: '2024-06-01', age: 51, gender: '여성', disease_code: 'M80.0', disease_name: '골다공증', address: '서울특별시 강동구 천호대로 159', region: '서울 강동구' },
  { patient_id: 'patient_014', name: '조성민', visit_date: '2024-06-05', age: 39, gender: '남성', disease_code: 'E11.9', disease_name: '당뇨병', address: '경기도 고양시 일산동구 정발산로 357', region: '경기 고양시' },
  { patient_id: 'patient_002', name: '김영희', visit_date: '2024-06-10', age: 52, gender: '여성', disease_code: 'M54.5', disease_name: '척추관협착증', address: '서울특별시 서초구 서초대로 456', region: '서울 서초구' },
  { patient_id: 'patient_015', name: '배혜진', visit_date: '2024-06-15', age: 53, gender: '여성', disease_code: 'M25.5', disease_name: '무릎관절증', surgery_name: '무릎관절경수술', address: '서울특별시 강남구 테헤란로 753', region: '서울 강남구' },
  { patient_id: 'patient_016', name: '류동욱', visit_date: '2024-06-20', age: 46, gender: '남성', disease_code: 'M54.5', disease_name: '척추관협착증', address: '서울특별시 서초구 서초대로 951', region: '서울 서초구' },
  { patient_id: 'patient_003', name: '이철수', visit_date: '2024-07-01', age: 38, gender: '남성', disease_code: 'I10', disease_name: '본태성 고혈압', address: '서울특별시 송파구 올림픽로 789', region: '서울 송파구' },
  { patient_id: 'patient_017', name: '문혜영', visit_date: '2024-07-05', age: 50, gender: '여성', disease_code: 'M75.1', disease_name: '어깨충돌증후군', address: '경기도 용인시 기흥구 신갈로 468', region: '경기 용인시' },
  { patient_id: 'patient_018', name: '송준호', visit_date: '2024-07-10', age: 57, gender: '남성', disease_code: 'M51.2', disease_name: '요추추간판장애', address: '서울특별시 마포구 홍대로 642', region: '서울 마포구' },
  { patient_id: 'patient_001', name: '홍길동', visit_date: '2024-07-15', age: 45, gender: '남성', disease_code: 'M25.5', disease_name: '무릎관절증', address: '서울특별시 강남구 테헤란로 123', region: '서울 강남구' },
  { patient_id: 'patient_019', name: '유나영', visit_date: '2024-07-20', age: 43, gender: '여성', disease_code: 'M80.0', disease_name: '골다공증', address: '서울특별시 강동구 천호대로 825', region: '서울 강동구' },
  { patient_id: 'patient_020', name: '전민석', visit_date: '2024-08-01', age: 48, gender: '남성', disease_code: 'E11.9', disease_name: '당뇨병', address: '경기도 고양시 일산동구 정발산로 147', region: '경기 고양시' },
]

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

  const filteredData = useMemo(() => {
    const baseData = isDataLoaded && rawData && rawData.length > 0 ? rawData : SAMPLE_PATIENT_DATA
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
            {isDataLoaded ? ' (실제 데이터)' : ' (샘플 데이터)'}
            {' · '}재방문 윈도우 {windowSize}일
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
