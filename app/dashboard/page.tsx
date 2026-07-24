'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FilterChipBar } from '@/components/filter/filter-chip-bar'
import { InsightBanner } from '@/components/layout/insight-banner'
import { MetricGlossary } from '@/components/layout/metric-glossary'
import { buildDashboardInsight } from '@/lib/utils/dashboard-insight'
import { EmptyState } from '@/components/ui/empty-state'
import { ChartSkeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { LayoutGrid, Map as MapIcon, BarChart3 } from 'lucide-react'
import { InteractiveDiseaseChart } from '@/components/charts/interactive-disease-chart'
import { LeafletMap } from '@/components/map/leaflet-map'
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
import {
  groupVisitsByPatient,
  resolvePatientId,
} from '@/lib/utils/patient-identity'
import {
  computeDiseaseRecurrenceRates,
  computeMonthlyTrend,
} from '@/lib/utils/monthly-trend'
import {
  hasActiveFilters,
  hasSurgery,
  calculateQuartiles,
  buildRegionVisitMap,
} from '@/lib/utils/analysis-helpers'
import { RetentionChart } from '@/components/charts/retention-chart'
import { DiseaseSurgeryHeatmap } from '@/components/charts/disease-surgery-heatmap'
import {
  SAMPLE_DATE_RANGE_LABEL,
  resolveAnalysisData,
  isUsingSampleData,
  getSampleMapPoints,
} from '@/lib/sample-data'
import { computeRetentionSummary, isReturningWithinWindow } from '@/lib/utils/strategy-metrics'

const MS_PER_DAY = 1000 * 60 * 60 * 24

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
  const [mapMode, setMapMode] = useState<'markers' | 'circle' | 'heatmap'>('markers')
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'charts'>('split')
  const {
    selectedDiseases,
    selectedRegions,
    selectedSurgeries,
    ageGroups,
    genders,
    dateRange,
    windowSize,
    addRegion,
    removeRegion,
    setSelectedH3Index,
    setSelectedChartData,
  } = useFilterStore()

  const handleMapLocationSelect = useCallback(
    (h3Index: string, point: { region?: string }) => {
      const region = point.region
      if (!region) {
        setSelectedH3Index(h3Index)
        return
      }
      const current = useFilterStore.getState().selectedRegions
      if (current.includes(region)) {
        removeRegion(region)
        setSelectedH3Index(null)
      } else {
        addRegion(region)
        setSelectedH3Index(h3Index)
        setSelectedChartData('region', region)
      }
    },
    [addRegion, removeRegion, setSelectedH3Index, setSelectedChartData]
  )
  
  const {
    isDataLoaded,
    mapData: storeMapData,
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

  // 업로드 데이터 우선, 없으면 공용 샘플
  const usingSample = isUsingSampleData(isDataLoaded, rawData)
  const baseData = useMemo(
    () => resolveAnalysisData(isDataLoaded, rawData),
    [isDataLoaded, rawData]
  )

  const storeMapFallback = useMemo(() => {
    if (!isDataLoaded) return getSampleMapPoints()
    if (storeMapData.length > 0) return storeMapData
    return buildRegionVisitMap(baseData, []).map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      region: p.region,
      h3Index: p.h3Index,
      value: p.value,
    }))
  }, [isDataLoaded, storeMapData, baseData])

  const filteredRawData = useMemo(() => {
    return filterPatients(baseData, {
      selectedDiseases,
      selectedRegions,
      selectedSurgeries,
      ageGroups,
      genders: genders as ('남성' | '여성')[],
      dateRange,
    })
  }, [
    baseData,
    selectedDiseases,
    selectedRegions,
    selectedSurgeries,
    ageGroups,
    genders,
    dateRange,
  ])

  const filteredMapData = useMemo(() => {
    if (filteredRawData.length === 0) {
      const active = hasActiveFilters({
        selectedDiseases,
        selectedSurgeries,
        selectedRegions,
        ageGroups,
        genders,
        dateRange,
      })
      return active ? [] : storeMapFallback
    }
    return buildRegionVisitMap(filteredRawData, storeMapFallback)
  }, [
    storeMapFallback,
    filteredRawData,
    selectedDiseases,
    selectedSurgeries,
    selectedRegions,
    ageGroups,
    genders,
    dateRange,
  ])

  const patientVisitsByKey = useMemo(() => {
    if (filteredRawData.length === 0) {
      return new Map<string, PatientData[]>()
    }
    return groupVisitsByPatient(filteredRawData)
  }, [filteredRawData])

  const diseaseRecurrenceRates = useMemo(() => {
    if (filteredRawData.length === 0) {
      return new Map<string, number>()
    }
    return computeDiseaseRecurrenceRates(filteredRawData, windowSize)
  }, [filteredRawData, windowSize])

  const retentionBuckets = useMemo(() => {
    const defs = [
      { label: '0-30일', min: 0, max: 30 },
      { label: '31-60일', min: 31, max: 60 },
      { label: '61-90일', min: 61, max: 90 },
      { label: '91-180일', min: 91, max: 180 },
      { label: '181일 이상', min: 181, max: Infinity },
    ]
    const counts = defs.map(() => 0)
    let total = 0
    patientVisitsByKey.forEach((visits) => {
      if (visits.length < 2) return
      const interval =
        (new Date(visits[1].visit_date).getTime() -
          new Date(visits[0].visit_date).getTime()) /
        MS_PER_DAY
      const idx = defs.findIndex((b) => interval >= b.min && interval <= b.max)
      if (idx >= 0) {
        counts[idx]++
        total++
      }
    })
    return defs.map((b, i) => ({
      bucket: b.label,
      count: counts[i],
      percentage: total > 0 ? Math.round((counts[i] / total) * 1000) / 10 : 0,
    }))
  }, [patientVisitsByKey])

  const diseaseSurgeryHeatmap = useMemo(() => {
    if (filteredRawData.length === 0) {
      return null
    }
    const surgeryCounts = new Map<string, number>()
    const diseaseCounts = new Map<string, number>()
    const matrix = new Map<string, Map<string, number>>()

    filteredRawData.forEach((row) => {
      if (!row.disease_name) return
      diseaseCounts.set(
        row.disease_name,
        (diseaseCounts.get(row.disease_name) || 0) + 1
      )
      if (!hasSurgery(row)) return
      const surgeryKey =
        row.surgery_name?.toString().trim() ||
        row.surgery_code?.toString().trim() ||
        ''
      if (!surgeryKey) return
      surgeryCounts.set(surgeryKey, (surgeryCounts.get(surgeryKey) || 0) + 1)
      if (!matrix.has(row.disease_name)) matrix.set(row.disease_name, new Map())
      const rowMap = matrix.get(row.disease_name)!
      rowMap.set(surgeryKey, (rowMap.get(surgeryKey) || 0) + 1)
    })

    const topSurgeries = Array.from(surgeryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name)
    const topDiseases = Array.from(diseaseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name)

    let maxValue = 0
    const rows = topDiseases.map((disease) => {
      const values: Record<string, number> = {}
      topSurgeries.forEach((surgery) => {
        const v = matrix.get(disease)?.get(surgery) || 0
        values[surgery] = v
        if (v > maxValue) maxValue = v
      })
      return { disease, values }
    })

    return { columns: topSurgeries, rows, maxValue }
  }, [filteredRawData])

  const filteredDiseases = useMemo(() => {
    if (filteredRawData.length === 0) return []

    const diseasePatients = new Map<string, Set<string>>()
    filteredRawData.forEach((patient) => {
      if (!patient.disease_name) return
      const key = resolvePatientId(patient)
      if (!diseasePatients.has(patient.disease_name)) {
        diseasePatients.set(patient.disease_name, new Set())
      }
      diseasePatients.get(patient.disease_name)!.add(key)
    })

    const totalUnique = new Set(
      filteredRawData.map((p) => resolvePatientId(p))
    ).size

    return Array.from(diseasePatients.entries())
      .map(([name, patients]) => ({
        name,
        count: patients.size,
        percentage: totalUnique > 0 ? (patients.size / totalUnique) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [filteredRawData])

  const filteredAgePyramid = useMemo(() => {
    if (filteredRawData.length === 0) return []

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
      const gender = normalizeGender(patient.gender)
      if (gender === '남성') existing.male++
      else if (gender === '여성') existing.female++
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
  }, [filteredRawData])

  // 수술 데이터 계산 (필터 반영)
  const surgeryData = useMemo(() => {
    if (filteredRawData.length === 0) {
      return { scatter: [], matrix: [], diseases: [] as string[] }
    }

    const surgeryStats: Record<
      string,
      { ages: number[]; patientKeys: Set<string>; diseases: Record<string, number> }
    > = {}

    filteredRawData.forEach((patient) => {
      if (!hasSurgery(patient)) return
      const surgeryKey =
        patient.surgery_name?.toString().trim() ||
        patient.surgery_code?.toString().trim() ||
        ''
      if (!surgeryKey) return
      if (!surgeryStats[surgeryKey]) {
        surgeryStats[surgeryKey] = {
          ages: [],
          patientKeys: new Set(),
          diseases: {},
        }
      }
      surgeryStats[surgeryKey].ages.push(patient.age)
      surgeryStats[surgeryKey].patientKeys.add(resolvePatientId(patient))
      surgeryStats[surgeryKey].diseases[patient.disease_name] =
        (surgeryStats[surgeryKey].diseases[patient.disease_name] || 0) + 1
    })

    const visitsByPatientGlobal = groupVisitsByPatient(filteredRawData)

    const scatter = Object.entries(surgeryStats)
      .map(([surgeryName, stats]) => {
        const totalSurgeryPatients = stats.patientKeys.size
        let returningCount = 0
        stats.patientKeys.forEach((key) => {
          const visits = visitsByPatientGlobal.get(key)
          if (visits && isReturningWithinWindow(visits, windowSize)) {
            returningCount++
          }
        })
        return {
          surgeryName,
          avgAge: stats.ages.reduce((sum, age) => sum + age, 0) / stats.ages.length,
          recurrenceRate:
            totalSurgeryPatients > 0
              ? (returningCount / totalSurgeryPatients) * 100
              : 0,
          patientCount: totalSurgeryPatients,
        }
      })
      .sort((a, b) => b.patientCount - a.patientCount)
      .slice(0, 10)

    const topSurgeries = scatter.slice(0, 5).map((s) => s.surgeryName)
    const topDiseases = filteredDiseases.slice(0, 5).map((d) => d.name)

    const matrix = topSurgeries.map((surgery) => {
      const row: { surgery: string; [key: string]: string | number } = { surgery }
      topDiseases.forEach((disease) => {
        row[disease] = surgeryStats[surgery]?.diseases[disease] || 0
      })
      return row
    })

    return { scatter, matrix, diseases: topDiseases }
  }, [filteredRawData, filteredDiseases, windowSize])

  const filteredBoundaryData = useMemo(() => {
    if (filteredRawData.length === 0) return []

    const regionStatsMap = new Map<
      string,
      {
        patientKeys: Set<string>
        ages: number[]
        visitsByPatient: Map<string, number[]>
      }
    >()

    filteredRawData.forEach((patient) => {
      if (!patient.region || patient.region === '미분류') return

      if (!regionStatsMap.has(patient.region)) {
        regionStatsMap.set(patient.region, {
          patientKeys: new Set(),
          ages: [],
          visitsByPatient: new Map(),
        })
      }

      const stats = regionStatsMap.get(patient.region)!
      const key = resolvePatientId(patient)
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

        return {
          region,
          patients: uniquePatients,
          recurrenceRate:
            uniquePatients > 0 ? (returningPatients / uniquePatients) * 100 : 0,
          avgAge: Math.round(avgAge * 10) / 10,
        }
      })
      .sort((a, b) => b.patients - a.patients)
      .slice(0, 10)
  }, [filteredRawData, windowSize])

  const filteredBoxplotData = useMemo(() => {
    if (filteredRawData.length === 0) return []

    const visitsByPatient = groupVisitsByPatient(filteredRawData)
    const regionIntervalsMap = new Map<string, number[]>()

    visitsByPatient.forEach((visits) => {
      if (visits.length < 2) return
      const region = visits[0].region
      if (!region || region === '미분류') return
      if (!regionIntervalsMap.has(region)) regionIntervalsMap.set(region, [])
      for (let i = 1; i < visits.length; i++) {
        const interval =
          (new Date(visits[i].visit_date).getTime() -
            new Date(visits[i - 1].visit_date).getTime()) /
          MS_PER_DAY
        if (interval <= windowSize) {
          regionIntervalsMap.get(region)!.push(interval)
        }
      }
    })

    return Array.from(regionIntervalsMap.entries())
      .filter(([, intervals]) => intervals.length >= 2)
      .map(([region, intervals]) => ({
        region,
        ...calculateQuartiles(intervals),
      }))
      .sort((a, b) => b.median - a.median)
      .slice(0, 10)
  }, [filteredRawData, windowSize])

  const filteredMonthlyTrend = useMemo(() => {
    if (filteredRawData.length === 0) return []
    return computeMonthlyTrend(filteredRawData, windowSize)
  }, [filteredRawData, windowSize])

  const selectedRegionStats = useMemo(() => {
    if (selectedRegions.length === 0 || filteredRawData.length === 0) {
      return { diseases: [], surgeries: [], patientCount: 0 }
    }

    const regionPatients = filteredRawData.filter((p) =>
      selectedRegions.includes(p.region)
    )
    if (regionPatients.length === 0) {
      return { diseases: [], surgeries: [], patientCount: 0 }
    }

    const diseaseCounts: Record<string, number> = {}
    regionPatients.forEach((p) => {
      diseaseCounts[p.disease_name] = (diseaseCounts[p.disease_name] || 0) + 1
    })
    const topDiseases = Object.entries(diseaseCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const surgeryCounts: Record<string, number> = {}
    regionPatients.forEach((p) => {
      if (!hasSurgery(p)) return
      const key =
        p.surgery_name?.toString().trim() ||
        p.surgery_code?.toString().trim() ||
        ''
      if (!key) return
      surgeryCounts[key] = (surgeryCounts[key] || 0) + 1
    })
    const topSurgeries = Object.entries(surgeryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      diseases: topDiseases,
      surgeries: topSurgeries,
      patientCount: new Set(regionPatients.map((p) => resolvePatientId(p))).size,
      totalRecords: regionPatients.length,
    }
  }, [selectedRegions, filteredRawData])

  const kpiData = useMemo(() => {
    if (patientVisitsByKey.size > 0) {
      const summary = computeRetentionSummary(filteredRawData, windowSize)
      const surgeryCount = filteredRawData.filter((p) => hasSurgery(p)).length
      return {
        totalPatients: summary.uniquePatients,
        recurrenceRate: summary.retentionRate.toFixed(1),
        avgInterval: summary.avgInterval,
        totalSurgery: surgeryCount,
      }
    }
    return {
      totalPatients: 0,
      recurrenceRate: '0.0',
      avgInterval: 0,
      totalSurgery: 0,
    }
  }, [filteredRawData, patientVisitsByKey, windowSize])

  const filtersActive = hasActiveFilters({
    selectedDiseases,
    selectedSurgeries,
    selectedRegions,
    ageGroups,
    genders,
    dateRange,
    windowSize,
    defaultWindowSize: 90,
  })

  const insight = useMemo(
    () =>
      buildDashboardInsight({
        recurrenceRate: Number(kpiData.recurrenceRate),
        totalPatients: kpiData.totalPatients,
        avgInterval: kpiData.avgInterval,
        windowSize,
        topRegion: filteredBoundaryData[0]?.region ?? null,
        topDisease: filteredDiseases[0]?.name ?? null,
        usingSample,
        emptyFilter: filtersActive && filteredRawData.length === 0,
      }),
    [
      kpiData,
      windowSize,
      filteredBoundaryData,
      filteredDiseases,
      usingSample,
      filtersActive,
      filteredRawData.length,
    ]
  )

  return (
    <div className="container mx-auto space-y-4 px-4 py-4 md:py-6" id="dashboard-main">
      <FilterChipBar />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-ink">통합 대시보드</h1>
          <p className="text-sm text-muted-foreground">
            {usingSample
              ? `샘플 데이터 (${SAMPLE_DATE_RANGE_LABEL})`
              : '실제 데이터'}
            {filtersActive && ' · 필터 적용'}
            {filtersActive && filteredRawData.length === 0 && ' · 필터 결과 없음'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MetricGlossary />
          <div className="inline-flex rounded-md border border-border bg-card p-0.5">
            {(
              [
                { id: 'split' as const, label: '지도+차트', icon: LayoutGrid },
                { id: 'map' as const, label: '지도만', icon: MapIcon },
                { id: 'charts' as const, label: '차트만', icon: BarChart3 },
              ]
            ).map((mode) => {
              const Icon = mode.icon
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
                    viewMode === mode.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-pressed={viewMode === mode.id}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              )
            })}
          </div>
          {!isDataLoaded && (
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/upload')}>
              <Upload className="mr-2 h-4 w-4" />
              데이터 업로드
            </Button>
          )}
          <ExportMenu data={filteredDiseases} />
        </div>
      </div>

      <InsightBanner
        insight={insight}
        onCta={
          insight.ctaLabel === '필터 초기화'
            ? () => useFilterStore.getState().resetFilters()
            : undefined
        }
      />

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
            <p className="text-xs text-muted-foreground">재방문율 · {windowSize}일</p>
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

      {/* Workspace — 1뷰포트 핵심 시각 */}
      <div className="grid grid-cols-12 gap-3">
        {(viewMode === 'split' || viewMode === 'map') && (
          <Card
            className={cn(
              'col-span-12',
              viewMode === 'split' ? 'lg:col-span-7' : 'lg:col-span-12'
            )}
            id="map-container"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">
                  공간 분석 지도
                  {selectedRegions.length > 0 && ` (${selectedRegions.length}개 지역 선택)`}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={mapMode === 'markers' ? 'default' : 'outline'}
                    onClick={() => setMapMode('markers')}
                  >
                    마커
                  </Button>
                  <Button
                    size="sm"
                    variant={mapMode === 'circle' ? 'default' : 'outline'}
                    onClick={() => setMapMode('circle')}
                  >
                    원형
                  </Button>
                  <Button
                    size="sm"
                    variant={mapMode === 'heatmap' ? 'default' : 'outline'}
                    onClick={() => setMapMode('heatmap')}
                  >
                    히트맵
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {filteredMapData.length === 0 ? (
                <EmptyState
                  title="표시할 지도 포인트가 없습니다"
                  description="필터를 완화하거나 좌표가 있는 데이터를 업로드하세요"
                  className="min-h-[320px]"
                />
              ) : (
                <LeafletMap
                  data={filteredMapData}
                  mode={mapMode}
                  selectedRegions={selectedRegions}
                  flyToOnSelect
                  flyToZoom={11}
                  minHeight={viewMode === 'map' ? 520 : 420}
                  center={[36.5, 127.5]}
                  zoom={7}
                  onLocationSelect={handleMapLocationSelect}
                />
              )}
            </CardContent>
          </Card>
        )}

        {(viewMode === 'split' || viewMode === 'charts') && (
          <div
            className={cn(
              'col-span-12 space-y-3',
              viewMode === 'split' ? 'lg:col-span-5' : 'lg:col-span-12 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0'
            )}
          >
            <Card id="disease-chart">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top 10 질병</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {filteredDiseases.length === 0 ? (
                  <EmptyState
                    title="질병 데이터가 없습니다"
                    description="필터 결과 또는 업로드 데이터를 확인하세요"
                    className="py-8"
                  />
                ) : (
                  <InteractiveDiseaseChart data={filteredDiseases} title="" />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">지역 비교</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {filteredBoundaryData.length === 0 ? (
                  <EmptyState
                    title="지역 통계가 없습니다"
                    className="py-8"
                  />
                ) : (
                  <BoundaryComparisonChart data={filteredBoundaryData} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 선택 영역 + 연령 — 2차 정보 */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-1" id="age-pyramid-chart">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">연령 분포</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AgePyramidChart data={filteredAgePyramid} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">선택 영역 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDiseases.length > 0 || selectedRegions.length > 0 ? (
              <div className="space-y-4">
                {selectedDiseases.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">선택된 질병</p>
                    <div className="space-y-1">
                      {selectedDiseases.map((disease) => (
                        <p key={disease} className="text-sm">
                          • {disease}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRegions.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">선택된 지역</p>
                    <div className="space-y-1">
                      {selectedRegions.map((region) => (
                        <p key={region} className="text-sm">
                          • {region}
                        </p>
                      ))}
                    </div>
                    {selectedRegionStats.patientCount > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <p className="mb-2 text-xs text-muted-foreground">
                          환자 수: {selectedRegionStats.patientCount.toLocaleString()}명
                          {selectedRegionStats.totalRecords && (
                            <span className="ml-1">
                              (방문 {selectedRegionStats.totalRecords.toLocaleString()}건)
                            </span>
                          )}
                        </p>
                        {selectedRegionStats.diseases.length > 0 && (
                          <div className="mb-3">
                            <p className="mb-1 text-xs font-medium">Top 5 질병</p>
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
                        {selectedRegionStats.surgeries.length > 0 && (
                          <div>
                            <p className="mb-1 text-xs font-medium">Top 5 수술</p>
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
              <EmptyState
                title="아직 선택된 항목이 없습니다"
                description="차트나 지도에서 항목을 클릭하면 필터가 적용됩니다"
                className="py-6"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trend" className="w-full" id="more-charts">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="trend">추세</TabsTrigger>
          <TabsTrigger value="boundary">지역</TabsTrigger>
          <TabsTrigger value="retention">재방문</TabsTrigger>
          <TabsTrigger value="table">표</TabsTrigger>
          <TabsTrigger value="surgery">수술</TabsTrigger>
          <TabsTrigger value="matrix">연관</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="mt-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">월별 신규·생애재방문</CardTitle>
                <p className="text-xs text-muted-foreground">
                  생애 첫 방문 이후 월 비중 · KPI {windowSize}일 윈도우와 별개
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {chartsReady ? (
                  <MonthlyTrendChart data={filteredMonthlyTrend} />
                ) : (
                  <ChartSkeleton />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">신규 vs 생애재방문</CardTitle>
                <p className="text-xs text-muted-foreground">
                  월별 생애 기준 (윈도우 미적용)
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {chartsReady ? (
                  <NewVsReturningChart data={filteredMonthlyTrend} />
                ) : (
                  <ChartSkeleton />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="boundary" className="mt-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
                <CardTitle className="text-base">재방문 간격 사분위</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  지역별 재방문 간격의 최소·Q1·중앙값·Q3·최대 (막대 근사)
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <BoxplotChart data={filteredBoxplotData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="retention" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">재방문 속도</CardTitle>
              <p className="text-xs text-muted-foreground">
                첫→두 번째 방문 간격 분포 (필터 반영)
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <RetentionChart
                data={
                  retentionBuckets.some((b) => b.count > 0)
                    ? retentionBuckets
                    : [
                        { bucket: '0-30일', count: 0, percentage: 0 },
                        { bucket: '31-60일', count: 0, percentage: 0 },
                        { bucket: '61-90일', count: 0, percentage: 0 },
                        { bucket: '91-180일', count: 0, percentage: 0 },
                        { bucket: '181일 이상', count: 0, percentage: 0 },
                      ]
                }
              />
            </CardContent>
          </Card>
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
                      <th className="p-4 text-left font-medium">순위</th>
                      <th className="p-4 text-left font-medium">질병명</th>
                      <th className="p-4 text-right font-medium">고유 환자</th>
                      <th className="p-4 text-right font-medium">비율</th>
                      <th className="p-4 text-right font-medium">재방문율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDiseases.map((disease, index) => (
                      <tr key={disease.name} className="border-b hover:bg-muted/50">
                        <td className="p-4">{index + 1}</td>
                        <td className="p-4 font-medium">{disease.name}</td>
                        <td className="p-4 text-right">{disease.count.toLocaleString()}</td>
                        <td className="p-4 text-right">{disease.percentage.toFixed(1)}%</td>
                        <td className="p-4 text-right tabular-nums">
                          {(diseaseRecurrenceRates.get(disease.name) ?? 0).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDiseases.length === 0 && (
                  <EmptyState
                    title="필터에 맞는 데이터가 없습니다"
                    description="칩 바에서 필터를 제거해 보세요"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surgery" className="mt-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">수술별 산점도</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  재방문율 = {windowSize}일 윈도우 ·{' '}
                  {isDataLoaded
                    ? `실제 데이터 ${surgeryData.scatter.length}개 수술`
                    : '샘플 데이터'}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <SurgeryScatterChart data={surgeryData.scatter} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">수술-질병 연관</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isDataLoaded
                    ? `Top ${surgeryData.matrix.length}개 수술 x Top ${surgeryData.diseases.length}개 질병`
                    : '샘플 데이터'}
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

        <TabsContent value="matrix" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">질병 × 수술 히트맵</CardTitle>
              <p className="text-xs text-muted-foreground">필터 반영</p>
            </CardHeader>
            <CardContent className="pt-0">
              {diseaseSurgeryHeatmap ? (
                <DiseaseSurgeryHeatmap
                  columns={diseaseSurgeryHeatmap.columns}
                  rows={diseaseSurgeryHeatmap.rows}
                  maxValue={diseaseSurgeryHeatmap.maxValue}
                />
              ) : (
                <EmptyState title="필터에 맞는 데이터가 없습니다" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
