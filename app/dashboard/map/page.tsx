'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { LeafletMap } from '@/components/map/leaflet-map'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Map, Layers, Users, Activity, Upload, Circle, Stethoscope, X } from 'lucide-react'
import { useDataStore } from '@/stores/data-store'
import { useRouter } from 'next/navigation'
import { FilterChipBar } from '@/components/filter/filter-chip-bar'
import { useFilterStore } from '@/stores/filter-store'
import { filterPatients } from '@/lib/utils/patient-filters'
import { normalizeGender, getAgeGroup } from '@/lib/utils/patient-helpers'
import {
  hasSurgery,
  hasActiveFilters as checkActiveFilters,
  buildRegionVisitMap,
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
  const { mapData, isDataLoaded, rawData } = useDataStore()
  const {
    selectedDiseases,
    selectedSurgeries,
    ageGroups,
    selectedRegions,
    genders,
    dateRange,
    windowSize,
    addRegion,
    removeRegion,
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

  const usingSample = isUsingSampleData(isDataLoaded, rawData)

  const handleLocationSelect = useCallback((h3Index: string, data: { region?: string }) => {
    setSelectedLocation({ h3Index, data })
    const region = data?.region
    if (region) {
      const { selectedRegions: regions } = useFilterStore.getState()
      if (regions.includes(region)) {
        removeRegion(region)
      } else {
        addRegion(region)
      }
    }
  }, [addRegion, removeRegion])

  const baseData = useMemo(
    () => resolveAnalysisData(isDataLoaded, rawData),
    [isDataLoaded, rawData]
  )

  // 업로드 후에는 샘플 좌표 폴백 금지. mapData 없으면 행 좌표로 보강.
  const baseMap = useMemo(() => {
    if (!isDataLoaded) return getSampleMapPoints()
    if (mapData.length > 0) return mapData
    return buildRegionVisitMap(baseData, []).map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      region: p.region,
      h3Index: p.h3Index,
    }))
  }, [isDataLoaded, mapData, baseData])

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
   * 임상 탭: 패널 질병/수술을 쓰지 않고 로컬 셀렉트만 사용.
   * (전역 filter-store를 덮어쓰지 않아 대시보드/전략과 충돌하지 않음)
   */
  const clinicalRows = useMemo(
    () =>
      filterPatients(baseData, {
        ...sharedFilterBase,
        selectedDiseases: [],
        selectedSurgeries: [],
      }),
    [baseData, sharedFilterBase]
  )

  const analysisRows =
    primaryTab === 'clinical' ? clinicalRows : panelFilteredData

  const diseaseOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    contextData.forEach((p) => {
      if (p.disease_name) counts[p.disease_name] = (counts[p.disease_name] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name]) => name)
  }, [contextData])

  const surgeryOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    contextData.forEach((p) => {
      if (!hasSurgery(p)) return
      const key = surgeryLabel(p)
      if (key) counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name]) => name)
  }, [contextData])

  useEffect(() => {
    if (!selectedDisease && diseaseOptions[0]) {
      setSelectedDisease(diseaseOptions[0])
    } else if (
      selectedDisease &&
      diseaseOptions.length > 0 &&
      !diseaseOptions.includes(selectedDisease)
    ) {
      setSelectedDisease(diseaseOptions[0])
    }
  }, [diseaseOptions, selectedDisease])

  useEffect(() => {
    if (!selectedSurgery && surgeryOptions[0]) {
      setSelectedSurgery(surgeryOptions[0])
    } else if (
      selectedSurgery &&
      surgeryOptions.length > 0 &&
      !surgeryOptions.includes(selectedSurgery)
    ) {
      setSelectedSurgery(surgeryOptions[0])
    }
  }, [surgeryOptions, selectedSurgery])

  const handleClinicalDiseaseChange = useCallback((disease: string) => {
    setSelectedDisease(disease)
  }, [])

  const handleClinicalSurgeryChange = useCallback((surgery: string) => {
    setSelectedSurgery(surgery)
  }, [])

  const handleClinicalDimChange = useCallback((dim: ClinicalDim) => {
    setClinicalDim(dim)
  }, [])

  const activeMetric: MapLayerMetric = useMemo(() => {
    if (primaryTab === 'distribution') return distMetric
    if (primaryTab === 'retention') return retentionMetric
    if (primaryTab === 'clinical') return clinicalDim
    return demoDim
  }, [primaryTab, distMetric, retentionMetric, clinicalDim, demoDim])

  const layerData = useMemo(() => {
    if (analysisRows.length === 0 || baseMap.length === 0) return []

    if (primaryTab === 'clinical' && clinicalDim === 'disease') {
      if (!selectedDisease) return []
      return computeMapLayer(analysisRows, baseMap, {
        metric: 'disease',
        windowSize,
        disease: selectedDisease,
      })
    }

    if (primaryTab === 'clinical' && clinicalDim === 'surgery') {
      if (!selectedSurgery) return []
      return computeMapLayer(analysisRows, baseMap, {
        metric: 'surgery',
        windowSize,
        surgery: selectedSurgery,
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

  const displayedUniquePatients = useMemo(() => {
    return new Set(analysisRows.map((p) => p.patient_id || `${p.name}|${p.address}`)).size
  }, [analysisRows])

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
    <div className="container mx-auto space-y-4 px-4 py-4 md:py-8">
      <FilterChipBar />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display mb-1 text-2xl font-bold text-brand-ink md:text-3xl">
            공간 분석 지도
          </h1>
          <p className="text-sm text-muted-foreground">
            OpenStreetMap 기반 공간 분석
            {usingSample
              ? ` (샘플 데이터 · ${SAMPLE_DATE_RANGE_LABEL} · 윈도우 ${windowSize}일)`
              : ` (실제 데이터 ${mapData.length}개 지역 · 윈도우 ${windowSize}일)`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <Badge variant="outline">
            <Map className="mr-1 h-3 w-3" />
            OpenStreetMap
          </Badge>
          <Badge variant="secondary">
            <Users className="mr-1 h-3 w-3" />
            {`${displayedUniquePatients.toLocaleString()}명`}
            {usingSample ? ' · 샘플' : ''}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">시각화:</span>
          <Button
            variant={visualizationMode === 'markers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizationMode('markers')}
          >
            <Map className="h-4 w-4 mr-1" />
            마커
          </Button>
          <Button
            variant={visualizationMode === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizationMode('circle')}
          >
            <Circle className="h-4 w-4 mr-1" />
            원형
          </Button>
          <Button
            variant={visualizationMode === 'heatmap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizationMode('heatmap')}
          >
            <Layers className="h-4 w-4 mr-1" />
            히트맵
          </Button>
        </div>
      </div>

      <Tabs
        value={primaryTab}
        onValueChange={(v) => setPrimaryTab(v as PrimaryTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 h-auto">
          <TabsTrigger value="distribution" className="gap-1">
            <Users className="h-4 w-4" />
            분포
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-1">
            <Activity className="h-4 w-4" />
            재방문
          </TabsTrigger>
          <TabsTrigger value="clinical" className="gap-1">
            <Stethoscope className="h-4 w-4" />
            임상
          </TabsTrigger>
          <TabsTrigger value="demographics" className="gap-1">
            <Layers className="h-4 w-4" />
            인구통계
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 보조 셀렉터 */}
      <div className="flex flex-wrap gap-3 items-center">
        {primaryTab === 'distribution' && (
          <Select
            value={distMetric}
            onValueChange={(v) => setDistMetric(v as DistMetric)}
          >
            <SelectTrigger className="w-44">
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
            <SelectTrigger className="w-44">
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
              <SelectTrigger className="w-32">
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
                <SelectTrigger className="w-56">
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
                <SelectTrigger className="w-56">
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
              <SelectTrigger className="w-36">
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
                <SelectTrigger className="w-40">
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
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-9">
          <CardHeader>
            <CardTitle>{header.title}</CardTitle>
            <CardDescription>{header.description}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {analysisRows.length === 0 && hasActiveFilters ? (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                필터 조건에 맞는 데이터가 없습니다
              </div>
            ) : primaryTab === 'clinical' &&
              ((clinicalDim === 'disease' && !selectedDisease) ||
                (clinicalDim === 'surgery' && !selectedSurgery)) ? (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                {clinicalDim === 'disease'
                  ? '질병을 선택하세요'
                  : '수술을 선택하세요'}
              </div>
            ) : layerData.length === 0 ? (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                {primaryTab === 'clinical'
                  ? '선택한 질병/수술에 해당하는 지역이 없습니다'
                  : '표시할 좌표 데이터가 없습니다'}
              </div>
            ) : (
              <LeafletMap
                center={usingSample ? SAMPLE_MAP_CENTER : [37.5665, 126.978]}
                zoom={usingSample ? SAMPLE_MAP_ZOOM : 11}
                data={layerData}
                mode={visualizationMode}
                selectedRegions={selectedRegions}
                flyToOnSelect
                flyToZoom={usingSample ? 11 : 12}
                onLocationSelect={handleLocationSelect}
              />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-3">
          <CardHeader>
            <CardTitle>통계</CardTitle>
            <CardDescription>{header.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!isPercentMetric && (
                <div>
                  <p className="text-sm font-medium">합계</p>
                  <p className="text-2xl font-bold">
                    {Math.round(stats.total).toLocaleString()}
                    {activeMetric === 'visits' ? '건' : '명'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {isPercentMetric ? '평균' : '평균/지역'}
                </p>
                <p className="text-2xl font-bold">
                  {isPercentMetric
                    ? `${stats.avg.toFixed(1)}%`
                    : Math.round(stats.avg).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">최대</p>
                <p className="text-2xl font-bold">
                  {isPercentMetric
                    ? `${stats.max.toFixed(1)}%`
                    : Math.round(stats.max).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">표시 지역</p>
                <p className="text-2xl font-bold">{layerData.length}개</p>
              </div>

              {topRegions.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Top 5 지역</p>
                  <div className="space-y-2">
                    {topRegions.map((item) => (
                      <div
                        key={item.region}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground truncate mr-2">
                          {item.rank}. {item.region}
                        </span>
                        <span className="font-medium shrink-0">
                          {isPercentMetric
                            ? `${item.value.toFixed(1)}%`
                            : Math.round(item.value).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {locationDetails && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{locationDetails.region}</CardTitle>
              <CardDescription>
                선택 지역 상세 · 윈도우 {windowSize}일
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLocation(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">방문 건수</p>
                <p className="text-xl font-bold">
                  {locationDetails.visitRows.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">고유 환자</p>
                <p className="text-xl font-bold">
                  {locationDetails.unique.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">신환 / 재환</p>
                <p className="text-xl font-bold">
                  {locationDetails.newPatients} /{' '}
                  {locationDetails.returningPatients}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">재방문율</p>
                <p className="text-xl font-bold">
                  {locationDetails.recurrenceRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="font-medium mb-2">질병 Top 5</p>
                <ul className="space-y-1 text-muted-foreground">
                  {locationDetails.topDiseases.map((d) => (
                    <li key={d.name}>
                      {d.name} ({d.count})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">수술 Top 5</p>
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
                <p className="font-medium mb-2">
                  평균 연령 {locationDetails.avgAge}세 · 남{' '}
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
