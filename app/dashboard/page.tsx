'use client'

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FilterPanel } from '@/components/filter/filter-panel'
import { InteractiveDiseaseChart } from '@/components/charts/interactive-disease-chart'
import { InteractiveMap } from '@/components/map/interactive-map'
import { AgePyramidChart } from '@/components/charts/age-pyramid-chart'
import { MonthlyTrendChart, NewVsReturningChart } from '@/components/charts/monthly-trend-chart'
import { BoundaryComparisonChart, BoxplotChart } from '@/components/charts/boundary-chart'
import { SurgeryScatterChart, SurgeryDiseaseMatrix } from '@/components/charts/surgery-chart'
import { ExportMenu } from '@/components/export/export-menu'
import { useFilterStore } from '@/stores/filter-store'
import { PatientData, useDataStore } from '@/stores/data-store'
import { Users, TrendingUp, Clock, Activity, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { normalizeGender } from '@/lib/utils/patient-helpers'
import { filterPatients } from '@/lib/utils/patient-filters'

// 샘플 데이터
const SAMPLE_DISEASES = [
  { name: '무릎관절증', count: 324, percentage: 26.2 },
  { name: '척추관협착증', count: 287, percentage: 23.3 },
  { name: '고혈압', count: 198, percentage: 16.0 },
  { name: '당뇨병', count: 156, percentage: 12.6 },
  { name: '어깨충돌증후군', count: 134, percentage: 10.9 },
  { name: '요추추간판장애', count: 98, percentage: 7.9 },
  { name: '골다공증', count: 76, percentage: 6.2 },
  { name: '슬개골연골연화증', count: 54, percentage: 4.4 },
  { name: '회전근개파열', count: 43, percentage: 3.5 },
  { name: '족저근막염', count: 32, percentage: 2.6 },
]

const SAMPLE_AGE_PYRAMID = [
  { ageGroup: '70대 이상', male: 145, female: 178 },
  { ageGroup: '60대', male: 234, female: 287 },
  { ageGroup: '50대', male: 298, female: 312 },
  { ageGroup: '40대', male: 187, female: 198 },
  { ageGroup: '30대', male: 123, female: 134 },
  { ageGroup: '20대', male: 76, female: 65 },
  { ageGroup: '10대 이하', male: 34, female: 28 },
]

const SAMPLE_MAP_DATA = [
  { latitude: 37.5665, longitude: 126.9780, value: 0.8, h3Index: 'h3-001', region: '서울 중구' },
  { latitude: 37.5700, longitude: 126.9850, value: 0.6, h3Index: 'h3-002', region: '서울 동대문구' },
  { latitude: 37.5550, longitude: 126.9700, value: 0.9, h3Index: 'h3-003', region: '서울 용산구' },
  { latitude: 37.5800, longitude: 127.0000, value: 0.7, h3Index: 'h3-004', region: '서울 성동구' },
  { latitude: 37.5500, longitude: 127.0500, value: 0.5, h3Index: 'h3-005', region: '서울 강남구' },
]

const SAMPLE_MONTHLY_TREND = [
  { month: '1월', recurrenceRate: 38.2, newPatients: 234, returningPatients: 145 },
  { month: '2월', recurrenceRate: 41.5, newPatients: 198, returningPatients: 140 },
  { month: '3월', recurrenceRate: 43.8, newPatients: 287, returningPatients: 223 },
  { month: '4월', recurrenceRate: 45.2, newPatients: 312, returningPatients: 260 },
  { month: '5월', recurrenceRate: 44.7, newPatients: 298, returningPatients: 243 },
  { month: '6월', recurrenceRate: 46.1, newPatients: 276, returningPatients: 235 },
]

const SAMPLE_BOUNDARY_DATA = [
  { region: '서울 강남구', patients: 342, recurrenceRate: 48.2, avgAge: 45 },
  { region: '서울 서초구', patients: 298, recurrenceRate: 46.5, avgAge: 43 },
  { region: '서울 송파구', patients: 287, recurrenceRate: 45.3, avgAge: 44 },
  { region: '서울 마포구', patients: 234, recurrenceRate: 43.8, avgAge: 42 },
]

const SAMPLE_BOXPLOT_DATA = [
  { region: '강남구', min: 14, q1: 21, median: 28, q3: 35, max: 56 },
  { region: '서초구', min: 12, q1: 19, median: 26, q3: 32, max: 48 },
  { region: '송파구', min: 15, q1: 22, median: 29, q3: 36, max: 52 },
]

const SAMPLE_SURGERY_SCATTER = [
  { surgeryName: '무릎관절경', avgAge: 58, recurrenceRate: 42.3, patientCount: 187 },
  { surgeryName: '척추유합술', avgAge: 62, recurrenceRate: 38.7, patientCount: 143 },
  { surgeryName: '어깨관절경', avgAge: 54, recurrenceRate: 45.8, patientCount: 98 },
]

const SAMPLE_SURGERY_MATRIX = [
  { surgery: '무릎관절경수술', '무릎관절증': 145, '척추관협착증': 12, '고혈압': 34 },
  { surgery: '척추유합술', '무릎관절증': 8, '척추관협착증': 98, '고혈압': 23 },
  { surgery: '어깨관절경수술', '무릎관절증': 5, '척추관협착증': 7, '고혈압': 18 },
]

const DEFAULT_WINDOW_SIZE = 90
const MS_PER_DAY = 1000 * 60 * 60 * 24

const getPatientKey = (patient: Pick<PatientData, 'name' | 'address'>) =>
  `${patient.name}|${patient.address}`

const calculateIntervalsWithinWindow = (visits: PatientData[], windowSize: number) => {
  const intervals: number[] = []

  for (let i = 1; i < visits.length; i++) {
    const current = new Date(visits[i].visit_date).getTime()
    const previous = new Date(visits[i - 1].visit_date).getTime()
    const interval = (current - previous) / MS_PER_DAY

    if (interval <= windowSize) {
      intervals.push(interval)
    }
  }

  return intervals
}

export default function DashboardPage() {
  const router = useRouter()
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
    isDataLoaded, 
    diseases: storeDiseases, 
    mapData: storeMapData,
    agePyramid: storeAgePyramid,
    boundaryData: storeBoundaryData,
    boxplotData: storeBoxplotData,
    monthlyTrend: storeMonthlyTrend,
    totalPatients: storeTotalPatients,
    recurrenceRate: storeRecurrenceRate,
    avgInterval: storeAvgInterval,
    totalSurgery: storeTotalSurgery,
    rawData,
  } = useDataStore()

  // 차트 지연 로딩을 위한 상태
  const [chartsReady, setChartsReady] = useState(false)

  // 데이터 로드 후 차트를 점진적으로 렌더링
  useEffect(() => {
    if (!isDataLoaded || rawData.length === 0) {
      setChartsReady(true) // 샘플 데이터는 즉시 표시
      return
    }

    // 데이터 업로드 직후에는 KPI만 먼저 표시하고, 차트는 지연 로딩
    setChartsReady(false)
    
    const loadCharts = () => {
      // requestIdleCallback을 사용해 브라우저가 여유 있을 때 차트 렌더링
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          setChartsReady(true)
        }, { timeout: 500 })
      } else {
        // 폴백: setTimeout 사용
        setTimeout(() => {
          setChartsReady(true)
        }, 100)
      }
    }

    loadCharts()
  }, [isDataLoaded, rawData.length])

  // 업로드된 데이터가 있으면 사용, 없으면 샘플 데이터 사용
  const diseases = isDataLoaded && storeDiseases.length > 0 ? storeDiseases : SAMPLE_DISEASES
  const mapData = isDataLoaded && storeMapData.length > 0 ? storeMapData : SAMPLE_MAP_DATA
  const boundaryData = isDataLoaded && storeBoundaryData.length > 0 ? storeBoundaryData : SAMPLE_BOUNDARY_DATA
  const boxplotData = isDataLoaded && storeBoxplotData.length > 0 ? storeBoxplotData : SAMPLE_BOXPLOT_DATA
  const monthlyTrend = isDataLoaded && storeMonthlyTrend.length > 0 ? storeMonthlyTrend : SAMPLE_MONTHLY_TREND
  // 필터링된 rawData 계산 (공통 유틸 사용)
  const filteredRawData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) return []

    return filterPatients(rawData, {
      selectedDiseases,
      selectedRegions,
      selectedSurgeries,
      ageGroups,
      genders: genders as ('남성' | '여성')[],
      dateRange,
    })
  }, [isDataLoaded, rawData, selectedDiseases, selectedRegions, selectedSurgeries, ageGroups, genders, dateRange])

  const patientVisitsByKey = useMemo(() => {
    const map = new Map<string, PatientData[]>()

    if (!isDataLoaded || filteredRawData.length === 0) {
      return map
    }

    filteredRawData.forEach((visit) => {
      const key = getPatientKey(visit)
      const visits = map.get(key) ?? []
      visits.push(visit)
      map.set(key, visits)
    })

    map.forEach((visits) => {
      visits.sort(
        (a, b) =>
          new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
      )
    })

    return map
  }, [filteredRawData, isDataLoaded])

  // 필터 적용된 질병 통계 재계산 (filteredRawData 기반)
  const filteredDiseases = useMemo(() => {
    // 필터가 적용되지 않았거나 데이터가 없으면 원본 사용
    if (filteredRawData.length === 0 && isDataLoaded) {
      return []
    }
    
    // 필터가 하나라도 적용되었으면 filteredRawData로부터 재계산
    const hasActiveFilter = 
      selectedDiseases.length > 0 || 
      selectedSurgeries.length > 0 ||
      selectedRegions.length > 0 || 
      ageGroups.length > 0 || 
      (genders.length > 0 && genders.length < 2)
    
    if (hasActiveFilter && filteredRawData.length > 0) {
      // 필터링된 데이터로부터 질병 통계 재계산
      const diseaseMap = new Map<string, number>()
      filteredRawData.forEach((patient) => {
        const count = diseaseMap.get(patient.disease_name) || 0
        diseaseMap.set(patient.disease_name, count + 1)
      })
      
      return Array.from(diseaseMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: (count / filteredRawData.length) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }
    
    // 필터가 없으면 원본 diseases 사용
    return diseases
  }, [diseases, filteredRawData, selectedDiseases, selectedSurgeries, selectedRegions, ageGroups, genders, isDataLoaded])

  // 연령 피라미드도 필터링된 데이터로 재계산
  const filteredAgePyramid = useMemo(() => {
    const hasActiveFilter = 
      selectedDiseases.length > 0 || 
      selectedSurgeries.length > 0 ||
      selectedRegions.length > 0 || 
      ageGroups.length > 0 || 
      (genders.length > 0 && genders.length < 2) ||
      (dateRange.start !== '2024-01-01' || dateRange.end !== '2024-12-31') ||
      windowSize !== DEFAULT_WINDOW_SIZE
    
    // 필터가 적용되고 데이터가 있으면 재계산
    if (hasActiveFilter && filteredRawData.length > 0 && isDataLoaded) {
      const ageGroupMap = new Map<string, { male: number; female: number }>()
      
      filteredRawData.forEach((patient) => {
        const age = patient.age
        let ageGroup = ''
        if (age < 20) ageGroup = '10대 이하'
        else if (age < 30) ageGroup = '20대'
        else if (age < 40) ageGroup = '30대'
        else if (age < 50) ageGroup = '40대'
        else if (age < 60) ageGroup = '50대'
        else if (age < 70) ageGroup = '60대'
        else ageGroup = '70대 이상'

        const existing = ageGroupMap.get(ageGroup) || { male: 0, female: 0 }
        // normalizeGender 로직을 직접 적용하여 일관된 성별 판별
        const normalizedGender = patient.gender?.toString().trim().toUpperCase() || ''
        if (normalizedGender === 'M' || normalizedGender === '남' || normalizedGender === '남성' || normalizedGender === 'MALE' || normalizedGender === '1') {
          existing.male++
        } else if (normalizedGender === 'F' || normalizedGender === '여' || normalizedGender === '여성' || normalizedGender === 'FEMALE' || normalizedGender === '2') {
          existing.female++
        }
        ageGroupMap.set(ageGroup, existing)
      })

      return [
        '70대 이상',
        '60대',
        '50대',
        '40대',
        '30대',
        '20대',
        '10대 이하',
      ].map((ageGroup) => ({
        ageGroup,
        male: ageGroupMap.get(ageGroup)?.male || 0,
        female: ageGroupMap.get(ageGroup)?.female || 0,
      }))
    }
    
    // 필터가 없으면 원본 사용
    return isDataLoaded && storeAgePyramid.length > 0 ? storeAgePyramid : SAMPLE_AGE_PYRAMID
  }, [
    filteredRawData,
    isDataLoaded,
    storeAgePyramid,
    selectedDiseases,
    selectedSurgeries,
    selectedRegions,
    ageGroups,
    genders,
    dateRange,
    windowSize,
  ])

  // 수술 데이터 계산 (useMemo로 최적화)
  const surgeryData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return {
        scatter: SAMPLE_SURGERY_SCATTER,
        matrix: SAMPLE_SURGERY_MATRIX,
        diseases: ['무릎관절증', '척추관협착증', '고혈압'],
      }
    }

    // 수술별 통계 계산 (이름+주소 기준)
    const surgeryStats: Record<string, { ages: number[]; patientKeys: Set<string>; diseases: Record<string, number> }> = {}
    
    rawData.forEach(patient => {
      if (patient.surgery_name) {
        if (!surgeryStats[patient.surgery_name]) {
          surgeryStats[patient.surgery_name] = {
            ages: [],
            patientKeys: new Set(),
            diseases: {},
          }
        }
        surgeryStats[patient.surgery_name].ages.push(patient.age)
        surgeryStats[patient.surgery_name].patientKeys.add(`${patient.name}|${patient.address}`)
        
        // 수술-질병 연관 집계
        surgeryStats[patient.surgery_name].diseases[patient.disease_name] = 
          (surgeryStats[patient.surgery_name].diseases[patient.disease_name] || 0) + 1
      }
    })

    // 수술별 실제 재방문율 계산: 해당 수술을 받은 환자 중 2회 이상 방문한 비율
    const patientVisitCountMap: Record<string, number> = {}
    rawData.forEach((p) => {
      const key = `${p.name}|${p.address}`
      patientVisitCountMap[key] = (patientVisitCountMap[key] || 0) + 1
    })

    // 산점도 데이터 (Top 10 수술)
    const scatter = Object.entries(surgeryStats)
      .map(([surgeryName, stats]) => {
        const totalSurgeryPatients = stats.patientKeys.size
        let returningCount = 0
        stats.patientKeys.forEach((key) => {
          if ((patientVisitCountMap[key] || 0) > 1) returningCount++
        })
        return {
          surgeryName,
          avgAge: stats.ages.reduce((sum, age) => sum + age, 0) / stats.ages.length,
          recurrenceRate: totalSurgeryPatients > 0 ? (returningCount / totalSurgeryPatients) * 100 : 0,
          patientCount: totalSurgeryPatients,
        }
      })
      .sort((a, b) => b.patientCount - a.patientCount)
      .slice(0, 10)

    // 매트릭스 데이터 (Top 5 수술 x Top 5 질병)
    const topSurgeries = scatter.slice(0, 5).map(s => s.surgeryName)
    const topDiseases = diseases.slice(0, 5).map(d => d.name)

    const matrix = topSurgeries.map(surgery => {
      const row: any = { surgery }
      topDiseases.forEach(disease => {
        row[disease] = surgeryStats[surgery]?.diseases[disease] || 0
      })
      return row
    }) as any[]

    return { scatter, matrix, diseases: topDiseases }
  }, [isDataLoaded, rawData, diseases])

  // 필터링된 Boundary 데이터 계산
  const filteredBoundaryData = useMemo(() => {
    if (!isDataLoaded || filteredRawData.length === 0) {
      return boundaryData // 필터 없으면 원본 사용
    }

    const regionStatsMap = new Map<
      string,
      {
        patientKeys: Set<string>
        ages: number[]
        visitsByPatient: Map<string, number[]>
      }
    >()

    filteredRawData.forEach((patient) => {
      if (!patient.region || patient.region === '미분류') {
        return
      }

      if (!regionStatsMap.has(patient.region)) {
        regionStatsMap.set(patient.region, {
          patientKeys: new Set(),
          ages: [],
          visitsByPatient: new Map(),
        })
      }

      const stats = regionStatsMap.get(patient.region)!
      const key = getPatientKey(patient)
      stats.patientKeys.add(key)
      stats.ages.push(patient.age)

      const visitList = stats.visitsByPatient.get(key) ?? []
      visitList.push(new Date(patient.visit_date).getTime())
      stats.visitsByPatient.set(key, visitList)
    })

    return Array.from(regionStatsMap.entries())
      .map(([region, stats]) => {
        const uniquePatients = stats.patientKeys.size
        const avgAge =
          stats.ages.length > 0
            ? stats.ages.reduce((sum, age) => sum + age, 0) / stats.ages.length
            : 0

        let returningPatients = 0
        stats.visitsByPatient.forEach((timestamps) => {
          timestamps.sort((a, b) => a - b)
          for (let i = 1; i < timestamps.length; i++) {
            const interval = (timestamps[i] - timestamps[i - 1]) / MS_PER_DAY
            if (interval <= windowSize) {
              returningPatients++
              break
            }
          }
        })

        const recurrenceRate =
          uniquePatients > 0 ? (returningPatients / uniquePatients) * 100 : 0

        return {
          region,
          patients: uniquePatients,
          recurrenceRate,
          avgAge: Math.round(avgAge * 10) / 10,
        }
      })
      .sort((a, b) => b.patients - a.patients)
      .slice(0, 10)
  }, [isDataLoaded, filteredRawData, boundaryData, windowSize])

  // 필터링된 Boxplot 데이터 계산
  const filteredBoxplotData = useMemo(() => {
    if (!isDataLoaded || filteredRawData.length === 0) {
      return boxplotData // 필터 없으면 원본 사용
    }

    const patientKey = (p: any) => `${p.name}|${p.address}`
    
    // 사분위수 계산 함수
    const calculateQuartiles = (values: number[]) => {
      if (values.length === 0) {
        return { min: 0, q1: 0, median: 0, q3: 0, max: 0 }
      }
      
      const sorted = [...values].sort((a, b) => a - b)
      const min = sorted[0]
      const max = sorted[sorted.length - 1]
      
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]
      
      const q1Index = Math.floor(sorted.length * 0.25)
      const q3Index = Math.floor(sorted.length * 0.75)
      
      const q1 = sorted[q1Index]
      const q3 = sorted[q3Index]
      
      return { min, q1, median, q3, max }
    }

    // 환자별 방문 횟수 계산
    const patientVisitCounts: Record<string, number> = {}
    filteredRawData.forEach((patient) => {
      const key = patientKey(patient)
      patientVisitCounts[key] = (patientVisitCounts[key] || 0) + 1
    })

    // 지역별 재방문 간격 수집
    const regionIntervalsMap = new Map<string, number[]>()

    Object.keys(patientVisitCounts).forEach((key) => {
      const patientVisits = filteredRawData
        .filter(p => patientKey(p) === key)
        .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
      
      if (patientVisits.length > 1) {
        const region = patientVisits[0].region
        
        if (region && region !== '미분류') {
          if (!regionIntervalsMap.has(region)) {
            regionIntervalsMap.set(region, [])
          }
          
          for (let i = 1; i < patientVisits.length; i++) {
            const interval =
              (new Date(patientVisits[i].visit_date).getTime() -
                new Date(patientVisits[i - 1].visit_date).getTime()) /
              MS_PER_DAY

            if (interval <= windowSize) {
              regionIntervalsMap.get(region)!.push(interval)
            }
          }
        }
      }
    })

    return Array.from(regionIntervalsMap.entries())
      .filter(([_, intervals]) => intervals.length >= 5)
      .map(([region, intervals]) => {
        const quartiles = calculateQuartiles(intervals)
        return {
          region,
          ...quartiles,
        }
      })
      .sort((a, b) => b.median - a.median)
      .slice(0, 10)
  }, [isDataLoaded, filteredRawData, boxplotData, windowSize])

  // 필터링된 월별 트렌드 계산
  const filteredMonthlyTrend = useMemo(() => {
    if (
      !isDataLoaded ||
      filteredRawData.length === 0 ||
      patientVisitsByKey.size === 0
    ) {
      return monthlyTrend // 필터 없으면 원본 사용
    }

    const monthlyData = new Map<
      string,
      { newPatients: Set<string>; returningPatients: Set<string> }
    >()

    // 환자별 첫 방문 월 추적
    const patientFirstVisitMonth = new Map<string, string>()
    
    // 날짜순으로 정렬된 방문 데이터로 처리
    const sortedVisits = Array.from(filteredRawData).sort(
      (a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
    )

    sortedVisits.forEach((patient) => {
      const date = new Date(patient.visit_date)
      const month = `${date.getMonth() + 1}월`
      const key = `${patient.name}|${patient.address}`

      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          newPatients: new Set(),
          returningPatients: new Set(),
        })
      }

      const bucket = monthlyData.get(month)!

      // 해당 환자의 첫 방문 월 확인
      if (!patientFirstVisitMonth.has(key)) {
        // 첫 방문이면 신규 환자로 분류
        patientFirstVisitMonth.set(key, month)
        bucket.newPatients.add(key)
      } else {
        // 이미 방문한 적이 있으면 재방문 환자로 분류
        bucket.returningPatients.add(key)
      }
    })

    const monthOrder = [
      '1월',
      '2월',
      '3월',
      '4월',
      '5월',
      '6월',
      '7월',
      '8월',
      '9월',
      '10월',
      '11월',
      '12월',
    ]

    return monthOrder
      .filter((month) => monthlyData.has(month))
      .map((month) => {
        const data = monthlyData.get(month)!
        const newCount = data.newPatients.size
        const returningCount = data.returningPatients.size
        const total = newCount + returningCount

        return {
          month,
          newPatients: newCount,
          returningPatients: returningCount,
          recurrenceRate: total > 0 ? (returningCount / total) * 100 : 0,
        }
      })
  }, [isDataLoaded, filteredRawData, monthlyTrend, patientVisitsByKey, windowSize])

  // 선택된 지역의 Top 5 질병/수술 계산
  const selectedRegionStats = useMemo(() => {
    if (!isDataLoaded || selectedRegions.length === 0 || filteredRawData.length === 0) {
      return { diseases: [], surgeries: [], patientCount: 0 }
    }

    // 선택된 지역의 방문 레코드 필터링 (다른 필터 조건을 모두 반영한 filteredRawData 사용)
    const regionPatients = filteredRawData.filter((p) =>
      selectedRegions.includes(p.region)
    )
    
    if (regionPatients.length === 0) {
      return { diseases: [], surgeries: [], patientCount: 0 }
    }

    // 질병 Top 5
    const diseaseCounts: Record<string, number> = {}
    regionPatients.forEach(p => {
      diseaseCounts[p.disease_name] = (diseaseCounts[p.disease_name] || 0) + 1
    })
    
    const topDiseases = Object.entries(diseaseCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 수술 Top 5
    const surgeryCounts: Record<string, number> = {}
    regionPatients.forEach(p => {
      if (p.surgery_name) {
        surgeryCounts[p.surgery_name] = (surgeryCounts[p.surgery_name] || 0) + 1
      }
    })
    
    const topSurgeries = Object.entries(surgeryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 고유 환자 수 계산 (이름+주소 기준)
    const uniquePatientKeys = new Set(
      regionPatients.map(p => `${p.name}|${p.address}`)
    )
    
    return {
      diseases: topDiseases,
      surgeries: topSurgeries,
      patientCount: uniquePatientKeys.size,
      totalRecords: regionPatients.length,
    }
  }, [isDataLoaded, selectedRegions, filteredRawData])

  // KPI 계산 - 필터가 적용되면 filteredRawData 기반으로 재계산
  const kpiData = useMemo(() => {
    const hasActiveFilter =
      selectedDiseases.length > 0 ||
      selectedSurgeries.length > 0 ||
      selectedRegions.length > 0 ||
      ageGroups.length > 0 ||
      (genders.length > 0 && genders.length < 2) ||
      (dateRange.start !== '2024-01-01' || dateRange.end !== '2024-12-31') ||
      windowSize !== DEFAULT_WINDOW_SIZE

    if (
      isDataLoaded &&
      filteredRawData.length > 0 &&
      patientVisitsByKey.size > 0 &&
      hasActiveFilter
    ) {
      const uniquePatients = patientVisitsByKey.size
      let returningPatients = 0
      const intervalsWithinWindow: number[] = []

      patientVisitsByKey.forEach((visits) => {
        const intervals = calculateIntervalsWithinWindow(visits, windowSize)
        if (intervals.length > 0) {
          returningPatients++
          intervalsWithinWindow.push(...intervals)
        }
      })

      const recurrenceRate =
        uniquePatients > 0 ? (returningPatients / uniquePatients) * 100 : 0

      const avgInterval =
        intervalsWithinWindow.length > 0
          ? Math.round(
              intervalsWithinWindow.reduce(
                (sum, interval) => sum + interval,
                0
              ) / intervalsWithinWindow.length
            )
          : 0

      const surgeryCount = filteredRawData.filter((p) => p.surgery_code).length

      return {
        totalPatients: uniquePatients,
        recurrenceRate: recurrenceRate.toFixed(1),
        avgInterval,
        totalSurgery: surgeryCount,
      }
    }

    // 필터가 없으면 전체 데이터의 KPI 사용
    if (isDataLoaded) {
      return {
        totalPatients: storeTotalPatients,
        recurrenceRate: storeRecurrenceRate.toFixed(1),
        avgInterval: storeAvgInterval,
        totalSurgery: storeTotalSurgery,
      }
    }

    // 샘플 데이터
    return {
      totalPatients: 1234,
      recurrenceRate: '45.2',
      avgInterval: 28,
      totalSurgery: Math.floor(1234 * 0.15),
    }
  }, [
    filteredRawData,
    isDataLoaded,
    patientVisitsByKey,
    selectedDiseases,
    selectedSurgeries,
    selectedRegions,
    ageGroups,
    genders,
    dateRange,
    windowSize,
    storeTotalPatients,
    storeRecurrenceRate,
    storeAvgInterval,
    storeTotalSurgery,
  ])

  return (
    <div className="container mx-auto px-4 py-6 space-y-4" id="dashboard-main">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-ink">통합 대시보드</h1>
          <p className="text-sm text-muted-foreground">
            {isDataLoaded ? '실제 데이터' : '샘플 데이터'}
            {(selectedDiseases.length > 0 || selectedRegions.length > 0) &&
              ` · 필터 ${selectedDiseases.length + selectedRegions.length}개`}
          </p>
        </div>
        <div className="flex gap-2">
          {!isDataLoaded && (
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/upload')}>
              <Upload className="h-4 w-4 mr-2" />
              데이터 업로드
            </Button>
          )}
          <ExportMenu data={filteredDiseases} />
        </div>
      </div>

      <FilterPanel />

      {/* KPI 메트릭 스트립 — 카드 중첩 없이 */}
      <div className="animate-kpi-in grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
        <div className="flex items-center justify-between bg-card/90 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">총 환자수</p>
            <p className="font-numeric text-xl font-bold tabular-nums">
              {kpiData.totalPatients.toLocaleString()}
            </p>
          </div>
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between bg-card/90 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">재방문율</p>
            <p className="font-numeric text-xl font-bold tabular-nums">
              {kpiData.recurrenceRate}%
            </p>
          </div>
          <TrendingUp className="h-5 w-5 text-positive" />
        </div>
        <div className="flex items-center justify-between bg-card/90 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">평균 간격</p>
            <p className="font-numeric text-xl font-bold tabular-nums">
              {kpiData.avgInterval}일
            </p>
          </div>
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between bg-card/90 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">총 수술 건수</p>
            <p className="font-numeric text-xl font-bold tabular-nums">
              {kpiData.totalSurgery}건
            </p>
          </div>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* 메인 대시보드 */}
      <div className="grid grid-cols-12 gap-3">
        {/* 좌측 패널 */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <Card id="disease-chart">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Top 10 질병</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InteractiveDiseaseChart data={filteredDiseases} title="" />
            </CardContent>
          </Card>
          <Card id="age-pyramid-chart">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">연령 분포</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <AgePyramidChart data={filteredAgePyramid} />
            </CardContent>
          </Card>
        </div>

        {/* 중앙 지도 */}
        <Card className="col-span-12 lg:col-span-6" id="map-container">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              공간 분석 지도
              {selectedRegions.length > 0 && ` (${selectedRegions.length}개 지역 선택)`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InteractiveMap data={mapData} mode="markers" />
          </CardContent>
        </Card>

        {/* 우측 패널 */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">선택 영역 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDiseases.length > 0 || selectedRegions.length > 0 ? (
              <div className="space-y-4">
                {selectedDiseases.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">선택된 질병</p>
                    <div className="space-y-1">
                      {selectedDiseases.map((disease) => (
                        <p key={disease} className="text-sm">• {disease}</p>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRegions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">선택된 지역</p>
                    <div className="space-y-1">
                      {selectedRegions.map((region) => (
                        <p key={region} className="text-sm">• {region}</p>
                      ))}
                    </div>
                    
                    {/* 지역별 통계 */}
                    {selectedRegionStats.patientCount > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          환자 수: {selectedRegionStats.patientCount.toLocaleString()}명
                          {selectedRegionStats.totalRecords && (
                            <span className="ml-1">
                              (방문 {selectedRegionStats.totalRecords.toLocaleString()}건)
                            </span>
                          )}
                        </p>
                        
                        {/* Top 5 질병 */}
                        {selectedRegionStats.diseases.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium mb-1">Top 5 질병</p>
                            <div className="space-y-1">
                              {selectedRegionStats.diseases.map((disease, idx) => (
                                <div key={disease.name} className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    {idx + 1}. {disease.name}
                                  </span>
                                  <span className="font-medium">{disease.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Top 5 수술 */}
                        {selectedRegionStats.surgeries.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1">Top 5 수술</p>
                            <div className="space-y-1">
                              {selectedRegionStats.surgeries.map((surgery, idx) => (
                                <div key={surgery.name} className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    {idx + 1}. {surgery.name}
                                  </span>
                                  <span className="font-medium">{surgery.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                차트나 지도에서 항목을 클릭하여 필터를 적용하세요
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 하단 탭 */}
      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="boundary">Boundary</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="surgery">Surgery</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">월별 추세</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {chartsReady ? (
                  <MonthlyTrendChart data={filteredMonthlyTrend} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    차트 로딩 중...
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">신규 vs 재방문</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {chartsReady ? (
                  <NewVsReturningChart data={filteredMonthlyTrend} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                    차트 로딩 중...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="boundary" className="mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">지역 비교</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <BoundaryComparisonChart data={filteredBoundaryData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">분포 분석</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <BoxplotChart data={filteredBoxplotData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">데이터 테이블</CardTitle>
              <p className="text-xs text-muted-foreground">
                전체 {filteredDiseases.length}개 질병 데이터
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">순위</th>
                      <th className="text-left p-4 font-medium">질병명</th>
                      <th className="text-right p-4 font-medium">환자수</th>
                      <th className="text-right p-4 font-medium">비율</th>
                      <th className="text-right p-4 font-medium">재방문율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDiseases.map((disease, index) => (
                      <tr key={disease.name} className="border-b hover:bg-muted/50">
                        <td className="p-4">{index + 1}</td>
                        <td className="p-4 font-medium">{disease.name}</td>
                        <td className="p-4 text-right">{disease.count.toLocaleString()}</td>
                        <td className="p-4 text-right">{disease.percentage.toFixed(1)}%</td>
                        <td className="p-4 text-right">
                          {(Math.random() * 30 + 30).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDiseases.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    필터에 맞는 데이터가 없습니다
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surgery" className="mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">수술별 산점도</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {isDataLoaded ? `실제 데이터 ${surgeryData.scatter.length}개 수술` : '샘플 데이터'}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <SurgeryScatterChart data={surgeryData.scatter} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">수술-질병 연관</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {isDataLoaded ? `Top ${surgeryData.matrix.length}개 수술 x Top ${surgeryData.diseases.length}개 질병` : '샘플 데이터'}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <SurgeryDiseaseMatrix
                  data={surgeryData.matrix}
                  diseases={surgeryData.diseases}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
