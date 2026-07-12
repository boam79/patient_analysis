'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { LeafletMap } from '@/components/map/leaflet-map'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Map, Layers, Users, Activity, Upload, Circle, Filter, X, Stethoscope } from 'lucide-react'
import { useDataStore } from '@/stores/data-store'
import { useRouter } from 'next/navigation'
import { FilterPanel } from '@/components/filter/filter-panel'
import { useFilterStore } from '@/stores/filter-store'
import { filterPatients } from '@/lib/utils/patient-filters'
import { normalizeGender, getAgeGroup } from '@/lib/utils/patient-helpers'
import {
  hasSurgery,
  hasActiveFilters as checkActiveFilters,
} from '@/lib/utils/analysis-helpers'
import {
  computeMapLayer,
  computeRegionPatientSplit,
  surgeryLabel,
  type MapLayerMetric,
} from '@/lib/utils/map-metrics'
import {
  SAMPLE_DATE_RANGE_LABEL,
  SAMPLE_MAP_CENTER,
  SAMPLE_MAP_ZOOM,
  resolveAnalysisData,
  getSampleMapPoints,
  isUsingSampleData,
} from '@/lib/sample-data'
import { cn } from '@/lib/utils'

type VisualizationMode = 'markers' | 'circle' | 'heatmap'
type PrimaryTab = 'distribution' | 'retention' | 'clinical' | 'demographics'

type DistMetric = 'visits' | 'unique' | 'new' | 'returning'
type RetentionMetric = 'recurrence_rate' | 'returning'
type ClinicalDim = 'disease' | 'surgery'
type DemoDim = 'age' | 'gender_male_pct'

const AGE_OPTIONS = [
  '10대 이하',
  '20대',
  '30대',
  '40대',
  '50대',
  '60대',
  '70대 이상',
]

const MODE_LABEL: Record<VisualizationMode, string> = {
  markers: '마커',
  circle: '원형',
  heatmap: '히트맵',
}

export default function MapPage() {
  const router = useRouter()
  const { mapData, isDataLoaded, rawData, totalPatients } = useDataStore()
  const {
    selectedDiseases,
    selectedSurgeries,
    ageGroups,
    selectedRegions,
    genders,
    dateRange,
    windowSize,
    setDiseases,
    setSurgeries,
  } = useFilterStore()

  const [selectedLocation, setSelectedLocation] = useState<{
    h3Index: string
    data: { region?: string }
  } | null>(null)
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('distribution')
  const [visualizationMode, setVisualizationMode] =
    useState<VisualizationMode>('markers')
  const [distMetric, setDistMetric] = useState<DistMetric>('visits')
  const [retentionMetric, setRetentionMetric] =
    useState<RetentionMetric>('recurrence_rate')
  const [clinicalDim, setClinicalDim] = useState<ClinicalDim>('disease')
  const [demoDim, setDemoDim] = useState<DemoDim>('age')
  const [selectedDisease, setSelectedDisease] = useState('')
  const [selectedSurgery, setSelectedSurgery] = useState('')
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (
      tab === 'distribution' ||
      tab === 'retention' ||
      tab === 'clinical' ||
      tab === 'demographics'
    ) {
      setPrimaryTab(tab)
    }
  }, [])

  const usingSample = isUsingSampleData(isDataLoaded, rawData)

  const handleLocationSelect = useCallback((h3Index: string, data: { region?: string }) => {
    setSelectedLocation({ h3Index, data })
    const region = data?.region
    if (region) {
      const { selectedRegions: regions, addRegion } = useFilterStore.getState()
      if (!regions.includes(region)) addRegion(region)
    }
  }, [])

  const baseData = useMemo(
    () => resolveAnalysisData(isDataLoaded, rawData),
    [isDataLoaded, rawData]
  )

  const baseMap = useMemo(() => {
    if (isDataLoaded && mapData.length > 0) return mapData
    return getSampleMapPoints()
  }, [isDataLoaded, mapData])

  const sharedFilterBase = useMemo(
    () => ({
      selectedRegions,
      ageGroups,
      genders: genders as ('남성' | '여성')[],
      dateRange,
    }),
    [selectedRegions, ageGroups, genders, dateRange]
  )

  /** 지역·연령·성별·기간만 적용 (임상 셀렉트용 옵션 모수) */
  const contextData = useMemo(
    () =>
      filterPatients(baseData, {
        ...sharedFilterBase,
        selectedDiseases: [],
        selectedSurgeries: [],
      }),
    [baseData, sharedFilterBase]
  )

  /** 필터 패널 전체 적용 (분포/재방문/인구통계) */
  const panelFilteredData = useMemo(
    () =>
      filterPatients(baseData, {
        ...sharedFilterBase,
        selectedDiseases,
        selectedSurgeries,
      }),
    [baseData, sharedFilterBase, selectedDiseases, selectedSurgeries]
  )

  /**
   * 임상 탭: 자기 차원 필터는 로컬 셀렉트가 담당.
   * 패널의 같은 차원 필터는 무시해 이중 필터로 0건이 되는 것을 막는다.
   */
  const clinicalRows = useMemo(
    () =>
      filterPatients(baseData, {
        ...sharedFilterBase,
        selectedDiseases: clinicalDim === 'surgery' ? selectedDiseases : [],
        selectedSurgeries: clinicalDim === 'disease' ? selectedSurgeries : [],
      }),
    [baseData, sharedFilterBase, clinicalDim, selectedDiseases, selectedSurgeries]
  )

  const analysisRows =
    primaryTab === 'clinical' ? clinicalRows : panelFilteredData

  const diseaseOptions = useMemo(() => {
    const source =
      clinicalDim === 'disease'
        ? filterPatients(baseData, {
            ...sharedFilterBase,
            selectedDiseases: [],
            selectedSurgeries,
          })
        : contextData
    const counts: Record<string, number> = {}
    source.forEach((p) => {
      if (p.disease_name) counts[p.disease_name] = (counts[p.disease_name] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name]) => name)
  }, [baseData, sharedFilterBase, selectedSurgeries, clinicalDim, contextData])

  const surgeryOptions = useMemo(() => {
    const source =
      clinicalDim === 'surgery'
        ? filterPatients(baseData, {
            ...sharedFilterBase,
            selectedDiseases,
            selectedSurgeries: [],
          })
        : contextData
    const counts: Record<string, number> = {}
    source.forEach((p) => {
      if (!hasSurgery(p)) return
      const key = surgeryLabel(p)
      if (key) counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name]) => name)
  }, [baseData, sharedFilterBase, selectedDiseases, clinicalDim, contextData])

  // 임상 셀렉트 ↔ 패널 필터 동기화 (한쪽만 남아 충돌하지 않게)
  useEffect(() => {
    if (primaryTab !== 'clinical') return
    if (clinicalDim === 'disease') {
      if (selectedDiseases.length === 1 && selectedDiseases[0] !== selectedDisease) {
        setSelectedDisease(selectedDiseases[0])
      }
    } else if (
      selectedSurgeries.length === 1 &&
      selectedSurgeries[0] !== selectedSurgery
    ) {
      setSelectedSurgery(selectedSurgeries[0])
    }
  }, [
    primaryTab,
    clinicalDim,
    selectedDiseases,
    selectedSurgeries,
    selectedDisease,
    selectedSurgery,
  ])

  useEffect(() => {
    if (!selectedDisease && diseaseOptions[0]) {
      setSelectedDisease(diseaseOptions[0])
      if (primaryTab === 'clinical' && clinicalDim === 'disease') {
        setDiseases([diseaseOptions[0]])
        setSurgeries([])
      }
    } else if (
      selectedDisease &&
      diseaseOptions.length > 0 &&
      !diseaseOptions.includes(selectedDisease)
    ) {
      setSelectedDisease(diseaseOptions[0])
      if (primaryTab === 'clinical' && clinicalDim === 'disease') {
        setDiseases([diseaseOptions[0]])
        setSurgeries([])
      }
    }
  }, [
    diseaseOptions,
    selectedDisease,
    primaryTab,
    clinicalDim,
    setDiseases,
    setSurgeries,
  ])

  useEffect(() => {
    if (!selectedSurgery && surgeryOptions[0]) {
      setSelectedSurgery(surgeryOptions[0])
      if (primaryTab === 'clinical' && clinicalDim === 'surgery') {
        setSurgeries([surgeryOptions[0]])
        setDiseases([])
      }
    } else if (
      selectedSurgery &&
      surgeryOptions.length > 0 &&
      !surgeryOptions.includes(selectedSurgery)
    ) {
      setSelectedSurgery(surgeryOptions[0])
      if (primaryTab === 'clinical' && clinicalDim === 'surgery') {
        setSurgeries([surgeryOptions[0]])
        setDiseases([])
      }
    }
  }, [
    surgeryOptions,
    selectedSurgery,
    primaryTab,
    clinicalDim,
    setDiseases,
    setSurgeries,
  ])

  const handleClinicalDiseaseChange = useCallback(
    (disease: string) => {
      setSelectedDisease(disease)
      setDiseases([disease])
      setSurgeries([])
    },
    [setDiseases, setSurgeries]
  )

  const handleClinicalSurgeryChange = useCallback(
    (surgery: string) => {
      setSelectedSurgery(surgery)
      setSurgeries([surgery])
      setDiseases([])
    },
    [setDiseases, setSurgeries]
  )

  const handleClinicalDimChange = useCallback(
    (dim: ClinicalDim) => {
      setClinicalDim(dim)
      if (dim === 'disease') {
        setSurgeries([])
        if (selectedDisease) setDiseases([selectedDisease])
      } else {
        setDiseases([])
        if (selectedSurgery) setSurgeries([selectedSurgery])
      }
    },
    [selectedDisease, selectedSurgery, setDiseases, setSurgeries]
  )

  const activeMetric: MapLayerMetric = useMemo(() => {
    if (primaryTab === 'distribution') return distMetric
    if (primaryTab === 'retention') return retentionMetric
    if (primaryTab === 'clinical') return clinicalDim
    return demoDim
  }, [primaryTab, distMetric, retentionMetric, clinicalDim, demoDim])

  const layerData = useMemo(() => {
    if (analysisRows.length === 0 || baseMap.length === 0) return []

    if (primaryTab === 'clinical' && clinicalDim === 'disease') {
      const diseaseFocus =
        selectedDisease ||
        (selectedDiseases.length > 0 ? selectedDiseases : undefined)
      if (!diseaseFocus || (Array.isArray(diseaseFocus) && diseaseFocus.length === 0)) {
        return []
      }
      return computeMapLayer(analysisRows, baseMap, {
        metric: 'disease',
        windowSize,
        disease: diseaseFocus,
      })
    }

    if (primaryTab === 'clinical' && clinicalDim === 'surgery') {
      const surgeryFocus =
        selectedSurgery ||
        (selectedSurgeries.length > 0 ? selectedSurgeries : undefined)
      if (!surgeryFocus || (Array.isArray(surgeryFocus) && surgeryFocus.length === 0)) {
        return []
      }
      return computeMapLayer(analysisRows, baseMap, {
        metric: 'surgery',
        windowSize,
        surgery: surgeryFocus,
      })
    }

    return computeMapLayer(analysisRows, baseMap, {
      metric: activeMetric,
      windowSize,
      ageGroup: selectedAgeGroup || undefined,
    })
  }, [
    analysisRows,
    baseMap,
    activeMetric,
    windowSize,
    selectedDisease,
    selectedSurgery,
    selectedDiseases,
    selectedSurgeries,
    selectedAgeGroup,
    primaryTab,
    clinicalDim,
  ])

  const stats = useMemo(() => {
    if (layerData.length === 0) return { total: 0, avg: 0, max: 0 }
    const total = layerData.reduce((s, d) => s + d.value, 0)
    const avg = total / layerData.length
    const max = Math.max(0, ...layerData.map((d) => d.value))
    return { total, avg, max }
  }, [layerData])

  const topRegions = useMemo(() => {
    return [...layerData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, index) => ({
        rank: index + 1,
        region: item.region || '미분류',
        value: item.value,
      }))
  }, [layerData])

  const locationDetails = useMemo(() => {
    if (!selectedLocation || analysisRows.length === 0) {
      return null
    }
    const region = selectedLocation.data?.region || '미분류'
    let regionData = analysisRows.filter((p) => p.region === region)
    if (primaryTab === 'clinical' && clinicalDim === 'disease' && selectedDisease) {
      regionData = regionData.filter((p) => p.disease_name === selectedDisease)
    }
    if (primaryTab === 'clinical' && clinicalDim === 'surgery' && selectedSurgery) {
      regionData = regionData.filter((p) => surgeryLabel(p) === selectedSurgery)
    }
    if (regionData.length === 0) return null

    const diseaseCounts: Record<string, number> = {}
    const surgeryCounts: Record<string, number> = {}
    const ageGroupCounts: Record<string, number> = {}
    const genderCounts = { male: 0, female: 0 }

    regionData.forEach((p) => {
      if (p.disease_name) {
        diseaseCounts[p.disease_name] = (diseaseCounts[p.disease_name] || 0) + 1
      }
      if (hasSurgery(p)) {
        const key = surgeryLabel(p)
        if (key) surgeryCounts[key] = (surgeryCounts[key] || 0) + 1
      }
      const ag = getAgeGroup(p.age)
      ageGroupCounts[ag] = (ageGroupCounts[ag] || 0) + 1
      const g = normalizeGender(p.gender)
      if (g === '남성') genderCounts.male++
      else if (g === '여성') genderCounts.female++
    })

    const split = computeRegionPatientSplit(regionData, windowSize)
    const avgAge =
      regionData.reduce((sum, p) => sum + p.age, 0) / regionData.length

    return {
      region,
      visitRows: regionData.length,
      ...split,
      avgAge: Math.round(avgAge),
      genderCounts,
      topDiseases: Object.entries(diseaseCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      topSurgeries: Object.entries(surgeryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      ageGroupCounts,
    }
  }, [
    selectedLocation,
    analysisRows,
    windowSize,
    primaryTab,
    clinicalDim,
    selectedDisease,
    selectedSurgery,
  ])

  const sampleUniquePatients = useMemo(() => {
    if (!usingSample) return totalPatients
    return new Set(baseData.map((p) => p.patient_id)).size
  }, [usingSample, totalPatients, baseData])

  const hasActiveFilters = useMemo(
    () =>
      checkActiveFilters({
        selectedDiseases,
        selectedSurgeries,
        selectedRegions,
        ageGroups,
        genders,
        dateRange,
        windowSize,
        defaultWindowSize: 90,
      }),
    [
      selectedDiseases,
      selectedSurgeries,
      ageGroups,
      selectedRegions,
      genders,
      dateRange,
      windowSize,
    ]
  )

  const isPercentMetric =
    activeMetric === 'recurrence_rate' || activeMetric === 'gender_male_pct'

  const titleForTab = (): { title: string; description: string } => {
    const mode = MODE_LABEL[visualizationMode]
    if (primaryTab === 'distribution') {
      const labels: Record<DistMetric, string> = {
        visits: '방문 수',
        unique: '고유 환자',
        new: '신환',
        returning: '재환',
      }
      return {
        title: `환자 분포 · ${labels[distMetric]}`,
        description: `지역별 ${labels[distMetric]} (${mode}) · 재방문 윈도우 ${windowSize}일`,
      }
    }
    if (primaryTab === 'retention') {
      return {
        title:
          retentionMetric === 'recurrence_rate'
            ? '재방문율 분포'
            : '재환 수 분포',
        description: `${windowSize}일 윈도우 기준 (${mode})`,
      }
    }
    if (primaryTab === 'clinical') {
      return {
        title: clinicalDim === 'disease' ? '질병별 분포' : '수술별 분포',
        description: `선택한 ${clinicalDim === 'disease' ? '질병' : '수술'}의 지역 방문 (${mode})`,
      }
    }
    return {
      title: demoDim === 'age' ? '연령대별 분포' : '성별 분포 (남성 비율 %)',
      description:
        demoDim === 'age'
          ? selectedAgeGroup
            ? `${selectedAgeGroup} (${mode})`
            : `전체 연령 (${mode})`
          : `지역별 남성 비율 (${mode})`,
    }
  }

  const header = titleForTab()

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="border-b border-border/80 bg-card/40 px-4 py-3">
        <div className="container mx-auto flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              공간 분석 지도
            </h1>
            <p className="text-sm text-muted-foreground">
              {usingSample
                ? `샘플 · ${SAMPLE_DATE_RANGE_LABEL}`
                : `실제 ${mapData.length}개 지역`}
              {' · '}윈도우 {windowSize}일 · {sampleUniquePatients.toLocaleString()}명
            </p>
          </div>
          {usingSample && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/upload')}
            >
              <Upload className="mr-2 h-4 w-4" />
              데이터 업로드
            </Button>
          )}
        </div>
      </div>

      {showFilterPanel && (
        <div className="border-b border-border bg-card px-4 py-3">
          <div className="container mx-auto">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">필터</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilterPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      <div className="analysis-toolbar">
        <Tabs
          value={primaryTab}
          onValueChange={(v) => setPrimaryTab(v as PrimaryTab)}
          className="w-auto"
        >
          <TabsList className="h-8 bg-muted/60">
            <TabsTrigger value="distribution" className="h-7 gap-1 px-2 text-xs">
              <Users className="h-3.5 w-3.5" />
              분포
            </TabsTrigger>
            <TabsTrigger value="retention" className="h-7 gap-1 px-2 text-xs">
              <Activity className="h-3.5 w-3.5" />
              재방문
            </TabsTrigger>
            <TabsTrigger value="clinical" className="h-7 gap-1 px-2 text-xs">
              <Stethoscope className="h-3.5 w-3.5" />
              임상
            </TabsTrigger>
            <TabsTrigger value="demographics" className="h-7 gap-1 px-2 text-xs">
              <Layers className="h-3.5 w-3.5" />
              인구
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {primaryTab === 'distribution' && (
          <Select
            value={distMetric}
            onValueChange={(v) => setDistMetric(v as DistMetric)}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visits">방문 수</SelectItem>
              <SelectItem value="unique">고유 환자</SelectItem>
              <SelectItem value="new">신환</SelectItem>
              <SelectItem value="returning">재환</SelectItem>
            </SelectContent>
          </Select>
        )}
        {primaryTab === 'retention' && (
          <Select
            value={retentionMetric}
            onValueChange={(v) => setRetentionMetric(v as RetentionMetric)}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurrence_rate">재방문율 (%)</SelectItem>
              <SelectItem value="returning">재환 수</SelectItem>
            </SelectContent>
          </Select>
        )}
        {primaryTab === 'clinical' && (
          <>
            <Select
              value={clinicalDim}
              onValueChange={(v) => handleClinicalDimChange(v as ClinicalDim)}
            >
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disease">질병</SelectItem>
                <SelectItem value="surgery">수술</SelectItem>
              </SelectContent>
            </Select>
            {clinicalDim === 'disease' ? (
              <Select
                value={selectedDisease}
                onValueChange={handleClinicalDiseaseChange}
                disabled={diseaseOptions.length === 0}
              >
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="질병 선택" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {diseaseOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={selectedSurgery}
                onValueChange={handleClinicalSurgeryChange}
                disabled={surgeryOptions.length === 0}
              >
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="수술 선택" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {surgeryOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        )}
        {primaryTab === 'demographics' && (
          <>
            <Select
              value={demoDim}
              onValueChange={(v) => setDemoDim(v as DemoDim)}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="age">연령대</SelectItem>
                <SelectItem value="gender_male_pct">성별(남성%)</SelectItem>
              </SelectContent>
            </Select>
            {demoDim === 'age' && (
              <Select
                value={selectedAgeGroup || '__all__'}
                onValueChange={(v) =>
                  setSelectedAgeGroup(v === '__all__' ? '' : v)
                }
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="전체 연령" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">전체 연령</SelectItem>
                  {AGE_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-1">
          {(
            [
              { mode: 'markers' as const, icon: Map, label: '마커' },
              { mode: 'circle' as const, icon: Circle, label: '원형' },
              { mode: 'heatmap' as const, icon: Layers, label: '히트맵' },
            ] as const
          ).map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              variant={visualizationMode === mode ? 'default' : 'outline'}
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setVisualizationMode(mode)}
            >
              <Icon className="mr-1 h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
          <Button
            variant={showFilterPanel ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter className="mr-1 h-3.5 w-3.5" />
            필터
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                !
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs lg:hidden"
            onClick={() => setMobileStatsOpen((v) => !v)}
          >
            통계
          </Button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="analysis-canvas relative min-h-[50vh] flex-1 border-0 border-b lg:min-h-[70vh] lg:border-b-0">
          {analysisRows.length === 0 && hasActiveFilters ? (
            <div className="flex h-full min-h-[50vh] items-center justify-center text-muted-foreground lg:min-h-[70vh]">
              필터 조건에 맞는 데이터가 없습니다
            </div>
          ) : primaryTab === 'clinical' &&
            ((clinicalDim === 'disease' && !selectedDisease) ||
              (clinicalDim === 'surgery' && !selectedSurgery)) ? (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 text-muted-foreground lg:min-h-[70vh]">
              <p>
                {clinicalDim === 'disease'
                  ? '질병을 선택하세요'
                  : '수술을 선택하세요'}
              </p>
              <p className="text-xs">상단 툴바에서 항목을 고르면 지도가 갱신됩니다</p>
            </div>
          ) : layerData.length === 0 ? (
            <div className="flex h-full min-h-[50vh] items-center justify-center text-muted-foreground lg:min-h-[70vh]">
              {primaryTab === 'clinical'
                ? '선택한 질병/수술에 해당하는 지역이 없습니다'
                : '표시할 좌표 데이터가 없습니다'}
            </div>
          ) : (
            <>
              <div className="absolute inset-0">
                <LeafletMap
                  center={usingSample ? SAMPLE_MAP_CENTER : [37.5665, 126.978]}
                  zoom={usingSample ? SAMPLE_MAP_ZOOM : 11}
                  data={layerData}
                  mode={visualizationMode}
                  selectedRegions={selectedRegions}
                  flyToOnSelect
                  flyToZoom={usingSample ? 11 : 12}
                  minHeight={520}
                  rounded={false}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
              <div className="map-legend">
                <p className="font-medium text-foreground">{header.title}</p>
                <p>{header.description}</p>
                {visualizationMode === 'heatmap' && (
                  <div className="mt-1 flex items-center gap-1">
                    <span
                      className="h-2 w-16"
                      style={{
                        background:
                          'linear-gradient(90deg, hsl(180 70% 32%), hsl(32 70% 48%))',
                      }}
                    />
                    <span>낮음 → 높음</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <aside
          className={cn(
            'stats-rail w-full shrink-0 lg:w-72 lg:animate-rail-settle',
            mobileStatsOpen ? 'block' : 'hidden lg:block'
          )}
          key={`${primaryTab}-${activeMetric}-${visualizationMode}`}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">{header.title}</p>
            <p className="text-xs text-muted-foreground">{header.description}</p>
          </div>
          <div className="space-y-4 px-4 py-4 animate-rail-settle">
            {!isPercentMetric && (
              <div>
                <p className="text-xs text-muted-foreground">합계</p>
                <p className="font-numeric text-2xl font-semibold tabular-nums">
                  {Math.round(stats.total).toLocaleString()}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {activeMetric === 'visits' ? '건' : '명'}
                  </span>
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">
                {isPercentMetric ? '평균' : '평균/지역'}
              </p>
              <p className="font-numeric text-2xl font-semibold tabular-nums">
                {isPercentMetric
                  ? `${stats.avg.toFixed(1)}%`
                  : Math.round(stats.avg).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">최대</p>
              <p className="font-numeric text-2xl font-semibold tabular-nums">
                {isPercentMetric
                  ? `${stats.max.toFixed(1)}%`
                  : Math.round(stats.max).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">표시 지역</p>
              <p className="font-numeric text-2xl font-semibold tabular-nums">
                {layerData.length}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  개
                </span>
              </p>
            </div>

            {topRegions.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Top 5 지역 · 클릭 시 선택
                </p>
                <div className="space-y-1">
                  {topRegions.map((item) => {
                    const point = layerData.find((d) => d.region === item.region)
                    return (
                      <button
                        key={item.region}
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-sm px-1 py-1.5 text-left text-sm hover:bg-accent hover:underline"
                        onClick={() => {
                          if (point) {
                            handleLocationSelect(point.h3Index || item.region, {
                              region: item.region,
                            })
                          }
                        }}
                      >
                        <span className="truncate text-muted-foreground">
                          {item.rank}. {item.region}
                        </span>
                        <span className="shrink-0 font-medium tabular-nums">
                          {isPercentMetric
                            ? `${item.value.toFixed(1)}%`
                            : Math.round(item.value).toLocaleString()}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {locationDetails && (
        <>
          <div
            className="fixed inset-0 z-40 bg-brand-ink/20 lg:bg-transparent"
            onClick={() => setSelectedLocation(null)}
            aria-hidden
          />
          <div
            className={cn(
              'fixed z-50 border border-border bg-card shadow-lg',
              'inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto animate-sheet-in-mobile rounded-t-lg',
              'lg:inset-y-auto lg:bottom-4 lg:right-4 lg:top-auto lg:max-h-[min(80vh,640px)] lg:w-[22rem] lg:animate-sheet-in lg:rounded-md'
            )}
            role="dialog"
            aria-label={`${locationDetails.region} 상세`}
          >
            <div className="flex items-start justify-between border-b border-border px-4 py-3">
              <div>
                <p className="font-display text-lg font-semibold">
                  {locationDetails.region}
                </p>
                <p className="text-xs text-muted-foreground">
                  선택 지역 · 윈도우 {windowSize}일
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLocation(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="metric-strip border-0 border-b">
              <div className="metric-strip-item py-2">
                <span className="metric-strip-label">방문</span>
                <span className="text-lg font-semibold tabular-nums">
                  {locationDetails.visitRows.toLocaleString()}
                </span>
              </div>
              <div className="metric-strip-item py-2">
                <span className="metric-strip-label">고유</span>
                <span className="text-lg font-semibold tabular-nums">
                  {locationDetails.unique.toLocaleString()}
                </span>
              </div>
              <div className="metric-strip-item py-2">
                <span className="metric-strip-label">신/재</span>
                <span className="text-lg font-semibold tabular-nums">
                  {locationDetails.newPatients}/{locationDetails.returningPatients}
                </span>
              </div>
              <div className="metric-strip-item py-2">
                <span className="metric-strip-label">재방문율</span>
                <span className="text-lg font-semibold tabular-nums">
                  {locationDetails.recurrenceRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="grid gap-4 p-4 text-sm sm:grid-cols-3 lg:grid-cols-1">
              <div>
                <p className="mb-1 font-medium">질병 Top 5</p>
                <ul className="space-y-1 text-muted-foreground">
                  {locationDetails.topDiseases.map((d) => (
                    <li key={d.name}>
                      {d.name} ({d.count})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-medium">수술 Top 5</p>
                <ul className="space-y-1 text-muted-foreground">
                  {locationDetails.topSurgeries.length === 0 && <li>없음</li>}
                  {locationDetails.topSurgeries.map((d) => (
                    <li key={d.name}>
                      {d.name} ({d.count})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-medium">
                  평균 {locationDetails.avgAge}세 · 남{' '}
                  {locationDetails.genderCounts.male} / 여{' '}
                  {locationDetails.genderCounts.female}
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {Object.entries(locationDetails.ageGroupCounts).map(
                    ([ag, count]) => (
                      <li key={ag}>
                        {ag}: {count}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

