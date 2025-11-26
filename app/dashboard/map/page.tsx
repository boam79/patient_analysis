'use client'

import { useState, useMemo } from 'react'
import { LeafletMap } from '@/components/map/leaflet-map'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Map, Layers, Users, Activity, Upload, Flame, Circle, Grid3x3, Filter, X } from 'lucide-react'
import { useDataStore } from '@/stores/data-store'
import { useRouter } from 'next/navigation'
import { FilterPanel } from '@/components/filter/filter-panel'
import { useFilterStore } from '@/stores/filter-store'

type VisualizationMode = 'markers' | 'heatmap' | 'cluster' | 'circle'
type AnalysisTab = 'new' | 'returning' | 'patients' | 'recurrence' | 'disease' | 'surgery' | 'age' | 'gender'

export default function MapPage() {
  const router = useRouter()
  const { mapData, isDataLoaded, rawData, totalPatients } = useDataStore()
  const { selectedDiseases, selectedSurgeries, ageGroups, selectedRegions, genders, dateRange } = useFilterStore()
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<AnalysisTab>('patients')
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('markers')
  const [selectedDisease, setSelectedDisease] = useState<string>('')
  const [selectedSurgery, setSelectedSurgery] = useState<string>('')
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  const handleLocationSelect = (h3Index: string, data: any) => {
    setSelectedLocation({ h3Index, data })
  }

  // 필터링된 rawData 계산 (먼저 선언)
  const filteredRawData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return []
    }

    let filtered = [...rawData]

    // 기간 필터
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(p => {
        const visitDate = new Date(p.visit_date)
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        return visitDate >= startDate && visitDate <= endDate
      })
    }

    // 질병 필터
    if (selectedDiseases.length > 0) {
      filtered = filtered.filter(p => selectedDiseases.includes(p.disease_name))
    }

    // 수술 필터
    if (selectedSurgeries.length > 0) {
      filtered = filtered.filter(
        (p) => p.surgery_name && selectedSurgeries.includes(p.surgery_name)
      )
    }

    // 지역 필터
    if (selectedRegions.length > 0) {
      filtered = filtered.filter(p => selectedRegions.includes(p.region))
    }

    // 연령 필터
    if (ageGroups.length > 0) {
      filtered = filtered.filter(p => {
        const age = p.age
        if (age < 20) return ageGroups.includes('10대 이하')
        if (age < 30) return ageGroups.includes('20대')
        if (age < 40) return ageGroups.includes('30대')
        if (age < 50) return ageGroups.includes('40대')
        if (age < 60) return ageGroups.includes('50대')
        if (age < 70) return ageGroups.includes('60대')
        return ageGroups.includes('70대 이상')
      })
    }

    // 성별 필터
    if (genders.length > 0 && genders.length < 2) {
      filtered = filtered.filter(p => 
        p.gender === genders[0] || 
        (genders[0] === '남성' && p.gender === 'M') ||
        (genders[0] === '여성' && p.gender === 'F')
      )
    }

    return filtered
  }, [
    isDataLoaded,
    rawData,
    selectedDiseases,
    selectedSurgeries,
    selectedRegions,
    ageGroups,
    genders,
    dateRange,
  ])

  // 선택된 지역의 상세 통계 계산
  const locationDetails = useMemo(() => {
    if (!selectedLocation || !isDataLoaded || rawData.length === 0) {
      return null
    }

    const region = selectedLocation.data?.region || '미분류'
    const regionData = filteredRawData.filter(p => p.region === region)

    if (regionData.length === 0) return null

    // 질병별 집계 (Top 5)
    const diseaseCounts: Record<string, number> = {}
    regionData.forEach(p => {
      if (p.disease_name) {
        diseaseCounts[p.disease_name] = (diseaseCounts[p.disease_name] || 0) + 1
      }
    })
    const topDiseases = Object.entries(diseaseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // 수술별 집계 (Top 5)
    const surgeryCounts: Record<string, number> = {}
    regionData.forEach(p => {
      if (p.surgery_name) {
        surgeryCounts[p.surgery_name] = (surgeryCounts[p.surgery_name] || 0) + 1
      }
    })
    const topSurgeries = Object.entries(surgeryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // 연령대별 집계
    const ageGroupCounts: Record<string, number> = {}
    regionData.forEach(p => {
      const age = p.age
      let ageGroup = ''
      if (age < 20) ageGroup = '10대 이하'
      else if (age < 30) ageGroup = '20대'
      else if (age < 40) ageGroup = '30대'
      else if (age < 50) ageGroup = '40대'
      else if (age < 60) ageGroup = '50대'
      else if (age < 70) ageGroup = '60대'
      else ageGroup = '70대 이상'
      ageGroupCounts[ageGroup] = (ageGroupCounts[ageGroup] || 0) + 1
    })

    // 성별 집계
    const genderCounts = { male: 0, female: 0 }
    regionData.forEach(p => {
      if (p.gender === 'M' || p.gender === '남성') genderCounts.male++
      else if (p.gender === 'F' || p.gender === '여성') genderCounts.female++
    })

    // 평균 연령
    const avgAge = regionData.reduce((sum, p) => sum + p.age, 0) / regionData.length

    // 재방문 환자 수
    const patientKey = (p: any) => `${p.name}|${p.address}`
    const patientVisits: Record<string, number> = {}
    regionData.forEach(p => {
      const key = patientKey(p)
      patientVisits[key] = (patientVisits[key] || 0) + 1
    })
    const returningPatients = Object.values(patientVisits).filter(count => count > 1).length
    const newPatients = Object.keys(patientVisits).length - returningPatients

    return {
      region,
      totalPatients: regionData.length,
      uniquePatients: Object.keys(patientVisits).length,
      newPatients,
      returningPatients,
      recurrenceRate: Object.keys(patientVisits).length > 0 
        ? (returningPatients / Object.keys(patientVisits).length) * 100 
        : 0,
      avgAge: Math.round(avgAge),
      genderCounts,
      topDiseases,
      topSurgeries,
      ageGroupCounts,
    }
  }, [selectedLocation, isDataLoaded, filteredRawData])

  // 실제 데이터가 없으면 샘플 데이터 사용
  const SAMPLE_DATA = [
    { latitude: 37.5665, longitude: 126.9780, value: 80 },
    { latitude: 37.5700, longitude: 126.9850, value: 60 },
    { latitude: 37.5550, longitude: 126.9700, value: 90 },
    { latitude: 37.5800, longitude: 127.0000, value: 70 },
    { latitude: 37.5500, longitude: 127.0500, value: 50 },
  ]

  // 신환/재환 계산 (이름+주소 기준)
  const patientTypeData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return {
        newPatients: SAMPLE_DATA.map(d => ({ ...d, value: d.value * 0.6 })),
        returningPatients: SAMPLE_DATA.map(d => ({ ...d, value: d.value * 0.4 })),
      }
    }

    // 환자별 방문 횟수 계산 (이름+주소 기준)
    const patientKey = (p: any) => `${p.name}|${p.address}`
    const patientVisits: Record<string, number> = {}
    rawData.forEach(patient => {
      const key = patientKey(patient)
      patientVisits[key] = (patientVisits[key] || 0) + 1
    })

    // 지역별 신환/재환 집계 (고유 환자 기준)
    const regionNewPatients: Record<string, Set<string>> = {}
    const regionReturningPatients: Record<string, Set<string>> = {}

    rawData.forEach(patient => {
      const key = patientKey(patient)
      const isNew = patientVisits[key] === 1
      
      if (!patient.region || patient.region === '미분류') return
      
      if (isNew) {
        if (!regionNewPatients[patient.region]) {
          regionNewPatients[patient.region] = new Set()
        }
        regionNewPatients[patient.region].add(key)
      } else {
        if (!regionReturningPatients[patient.region]) {
          regionReturningPatients[patient.region] = new Set()
        }
        regionReturningPatients[patient.region].add(key)
      }
    })

    // 지도 데이터와 매핑
    const newPatients = mapData.map(m => ({
      ...m,
      value: regionNewPatients[m.region]?.size || 0,
    }))

    const returningPatients = mapData.map(m => ({
      ...m,
      value: regionReturningPatients[m.region]?.size || 0,
    }))

    return { newPatients, returningPatients }
  }, [isDataLoaded, rawData, mapData])

  // 재방문율 계산 (지역별)
  const recurrenceData = useMemo(() => {
    if (!isDataLoaded || mapData.length === 0) {
      return SAMPLE_DATA.map(d => ({ ...d, value: d.value * 0.45 }))
    }

    return mapData.map(m => {
      // 타입 안전성을 위해 region 체크
      const region = m.region || ''
      if (!region) {
        return { ...m, value: 0 }
      }
      
      const newCount = patientTypeData.newPatients.find((p: any) => p.region === region)?.value || 0
      const returningCount = patientTypeData.returningPatients.find((p: any) => p.region === region)?.value || 0
      const total = newCount + returningCount
      
      return {
        ...m,
        value: total > 0 ? (returningCount / total) * 100 : 0, // 지역별 재방문율 %
      }
    })
  }, [isDataLoaded, mapData, patientTypeData])

  // 질병별 분포 데이터 계산
  const diseaseData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0 || !selectedDisease) {
      return []
    }

    // 선택된 질병의 지역별 집계 (필터 적용된 데이터 사용)
    const regionCounts: Record<string, number> = {}
    filteredRawData.forEach(patient => {
      if (patient.disease_name === selectedDisease && patient.region && patient.region !== '미분류') {
        regionCounts[patient.region] = (regionCounts[patient.region] || 0) + 1
      }
    })

    // mapData와 매핑
    return mapData.map(m => ({
      ...m,
      value: regionCounts[m.region] || 0,
    }))
  }, [isDataLoaded, filteredRawData, mapData, selectedDisease])

  // 수술별 분포 데이터 계산
  const surgeryData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0 || !selectedSurgery) {
      return []
    }

    // 선택된 수술의 지역별 집계 (필터 적용된 데이터 사용)
    const regionCounts: Record<string, number> = {}
    filteredRawData.forEach(patient => {
      if (patient.surgery_name === selectedSurgery && patient.region && patient.region !== '미분류') {
        regionCounts[patient.region] = (regionCounts[patient.region] || 0) + 1
      }
    })

    // mapData와 매핑
    return mapData.map(m => ({
      ...m,
      value: regionCounts[m.region] || 0,
    }))
  }, [isDataLoaded, filteredRawData, mapData, selectedSurgery])

  // 질병 목록 추출 (Top 20)
  const diseaseOptions = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return []
    }

    const diseaseCounts: Record<string, number> = {}
    filteredRawData.forEach(patient => {
      if (patient.disease_name) {
        diseaseCounts[patient.disease_name] = (diseaseCounts[patient.disease_name] || 0) + 1
      }
    })

    return Object.entries(diseaseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name]) => name)
  }, [isDataLoaded, filteredRawData])

  // 수술 목록 추출 (Top 20)
  const surgeryOptions = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return []
    }

    const surgeryCounts: Record<string, number> = {}
    rawData.forEach(patient => {
      if (patient.surgery_name) {
        surgeryCounts[patient.surgery_name] = (surgeryCounts[patient.surgery_name] || 0) + 1
      }
    })

    return Object.entries(surgeryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name]) => name)
  }, [isDataLoaded, filteredRawData])

  // 연령대별 분포 데이터 계산
  const ageGroupData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0 || !selectedAgeGroup) {
      return []
    }

    // 선택된 연령대의 지역별 집계 (필터 적용된 데이터 사용)
    const regionCounts: Record<string, number> = {}
    filteredRawData.forEach(patient => {
      if (patient.region && patient.region !== '미분류') {
        const age = patient.age
        let ageGroup = ''
        if (age < 20) ageGroup = '10대 이하'
        else if (age < 30) ageGroup = '20대'
        else if (age < 40) ageGroup = '30대'
        else if (age < 50) ageGroup = '40대'
        else if (age < 60) ageGroup = '50대'
        else if (age < 70) ageGroup = '60대'
        else ageGroup = '70대 이상'

        if (ageGroup === selectedAgeGroup) {
          regionCounts[patient.region] = (regionCounts[patient.region] || 0) + 1
        }
      }
    })

    // mapData와 매핑
    return mapData.map(m => ({
      ...m,
      value: regionCounts[m.region] || 0,
    }))
  }, [isDataLoaded, filteredRawData, mapData, selectedAgeGroup])

  // 성별 분포 데이터 계산
  const genderData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return []
    }

    // 지역별 성별 집계 (필터 적용된 데이터 사용)
    const regionGenderCounts: Record<string, { male: number; female: number; total: number }> = {}
    filteredRawData.forEach(patient => {
      if (patient.region && patient.region !== '미분류') {
        if (!regionGenderCounts[patient.region]) {
          regionGenderCounts[patient.region] = { male: 0, female: 0, total: 0 }
        }
        
        const gender = patient.gender === 'M' || patient.gender === '남성' ? 'male' : 'female'
        regionGenderCounts[patient.region][gender]++
        regionGenderCounts[patient.region].total++
      }
    })

    // mapData와 매핑 (남성 비율 %)
    return mapData.map(m => {
      const counts = regionGenderCounts[m.region] || { male: 0, female: 0, total: 0 }
      const maleRatio = counts.total > 0 ? (counts.male / counts.total) * 100 : 0
      return {
        ...m,
        value: maleRatio, // 남성 비율 (%)
        maleCount: counts.male,
        femaleCount: counts.female,
        totalCount: counts.total,
      }
    })
  }, [isDataLoaded, rawData, mapData])

  // 연령대 옵션
  const ageGroupOptions = [
    '10대 이하',
    '20대',
    '30대',
    '40대',
    '50대',
    '60대',
    '70대 이상',
  ]

  // 각 탭에 맞는 데이터 생성
  const getDataForTab = () => {
    if (!isDataLoaded) {
      // 샘플 데이터 사용
      switch(activeTab) {
        case 'new':
          return SAMPLE_DATA.map(d => ({ ...d, value: d.value * 0.6 }))
        case 'returning':
          return SAMPLE_DATA.map(d => ({ ...d, value: d.value * 0.4 }))
        case 'patients':
          return SAMPLE_DATA
        case 'recurrence':
          return SAMPLE_DATA.map(d => ({ ...d, value: 45 }))
        case 'disease':
        case 'surgery':
        case 'age':
        case 'gender':
          return []
        default:
          return SAMPLE_DATA
      }
    }

    // 실제 데이터 사용
    switch(activeTab) {
      case 'new':
        return patientTypeData.newPatients
      case 'returning':
        return patientTypeData.returningPatients
      case 'patients':
        return mapData
      case 'recurrence':
        return recurrenceData
      case 'disease':
        return diseaseData
      case 'surgery':
        return surgeryData
      case 'age':
        return ageGroupData
      case 'gender':
        return genderData
      default:
        return mapData
    }
  }

  // 통계 계산
  const stats = useMemo(() => {
    const data = getDataForTab()
    
    if (activeTab === 'recurrence') {
      // 재방문율은 평균과 최대값만 표시
      const avg = data.length > 0 
        ? data.reduce((sum, d) => sum + d.value, 0) / data.length 
        : 0
      const max = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0
      return { total: 0, avg, max }
    }
    
    // 신환, 재환, 환자수는 합계, 평균, 최대값 표시
    const total = data.reduce((sum, d) => sum + d.value, 0)
    const avg = data.length > 0 ? Math.round(total / data.length) : 0
    const max = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0

    return { total, avg, max }
  }, [activeTab, isDataLoaded, mapData, patientTypeData, recurrenceData, diseaseData, surgeryData, ageGroupData, genderData])

  // Top 5 지역 리스트
  const topRegions = useMemo(() => {
    const data = getDataForTab()
    if (data.length === 0) return []

    return [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item: any, index) => ({
        rank: index + 1,
        region: item.region || '미분류',
        value: item.value,
      }))
  }, [activeTab, isDataLoaded, mapData, patientTypeData, recurrenceData, diseaseData, surgeryData])

  // 필터 적용 여부 확인
  const hasActiveFilters = useMemo(() => {
    return (
      selectedDiseases.length > 0 ||
      selectedSurgeries.length > 0 ||
      ageGroups.length > 0 ||
      selectedRegions.length > 0 ||
      (genders.length > 0 && genders.length < 2) ||
      (dateRange.start !== '2024-01-01' || dateRange.end !== '2024-12-31')
    )
  }, [selectedDiseases, selectedSurgeries, ageGroups, selectedRegions, genders, dateRange])

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">공간 분석 지도</h1>
          <p className="text-muted-foreground">
            OpenStreetMap 기반 환자 분포 마커
            {isDataLoaded ? ` (실제 데이터 ${mapData.length}개 지역)` : ' (샘플 데이터)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilterPanel ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter className="h-4 w-4 mr-2" />
            필터
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                !
              </Badge>
            )}
          </Button>
          {!isDataLoaded && (
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/upload')}>
              <Upload className="h-4 w-4 mr-2" />
              데이터 업로드
            </Button>
          )}
          <Badge variant="outline">
            <Map className="h-3 w-3 mr-1" />
            OpenStreetMap
          </Badge>
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {isDataLoaded ? `${totalPatients.toLocaleString()}명` : '샘플'}
          </Badge>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilterPanel && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>필터</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowFilterPanel(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <FilterPanel />
          </CardContent>
        </Card>
      )}

      {/* 시각화 모드 선택 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">시각화 모드:</span>
          <div className="flex gap-2">
            <Button
              variant={visualizationMode === 'markers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVisualizationMode('markers')}
            >
              <Map className="h-4 w-4 mr-1" />
              마커
            </Button>
            <Button
              variant={visualizationMode === 'heatmap' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVisualizationMode('heatmap')}
            >
              <Flame className="h-4 w-4 mr-1" />
              히트맵
            </Button>
            <Button
              variant={visualizationMode === 'cluster' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVisualizationMode('cluster')}
            >
              <Grid3x3 className="h-4 w-4 mr-1" />
              클러스터
            </Button>
            <Button
              variant={visualizationMode === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVisualizationMode('circle')}
            >
              <Circle className="h-4 w-4 mr-1" />
              원형
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-8 mb-6">
          <TabsTrigger value="new">
            <Users className="h-4 w-4 mr-2" />
            신환
          </TabsTrigger>
          <TabsTrigger value="returning">
            <Activity className="h-4 w-4 mr-2" />
            재환
          </TabsTrigger>
          <TabsTrigger value="patients">
            <Users className="h-4 w-4 mr-2" />
            환자수
          </TabsTrigger>
          <TabsTrigger value="recurrence">
            <Activity className="h-4 w-4 mr-2" />
            재방문율
          </TabsTrigger>
          <TabsTrigger value="disease">
            <Layers className="h-4 w-4 mr-2" />
            질병별
          </TabsTrigger>
          <TabsTrigger value="surgery">
            <Activity className="h-4 w-4 mr-2" />
            수술별
          </TabsTrigger>
          <TabsTrigger value="age">
            <Users className="h-4 w-4 mr-2" />
            연령대별
          </TabsTrigger>
          <TabsTrigger value="gender">
            <Users className="h-4 w-4 mr-2" />
            성별
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-9">
              <CardHeader>
                <CardTitle>신환 분포</CardTitle>
                <CardDescription>첫 방문 환자 분포 (마커)</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <LeafletMap
                  center={[37.5665, 126.9780]}
                  zoom={11}
                  data={getDataForTab()}
                  mode={visualizationMode}
                  onLocationSelect={handleLocationSelect}
                />
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-3">
              <CardHeader>
                <CardTitle>통계</CardTitle>
                <CardDescription>신환 통계</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">총 신환수</p>
                    <p className="text-2xl font-bold">{stats.total.toLocaleString()}명</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">평균 신환/지역</p>
                    <p className="text-2xl font-bold">{stats.avg.toLocaleString()}명</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">최대 신환수</p>
                    <p className="text-2xl font-bold">{stats.max.toLocaleString()}명</p>
                  </div>
                  
                  {/* Top 5 지역 리스트 */}
                  {topRegions.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Top 5 지역</p>
                      <div className="space-y-2">
                        {topRegions.map((item) => (
                          <div key={item.region} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.rank}. {item.region}
                            </span>
                            <span className="font-medium">{item.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="returning" className="mt-6">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-9">
              <CardHeader>
                <CardTitle>재환 분포</CardTitle>
                <CardDescription>재방문 환자 분포 (마커)</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <LeafletMap
                  center={[37.5665, 126.9780]}
                  zoom={11}
                  data={getDataForTab()}
                  mode={visualizationMode}
                  onLocationSelect={handleLocationSelect}
                />
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-3">
              <CardHeader>
                <CardTitle>통계</CardTitle>
                <CardDescription>재환 통계</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">총 재환수</p>
                    <p className="text-2xl font-bold">{stats.total.toLocaleString()}명</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">평균 재환/지역</p>
                    <p className="text-2xl font-bold">{stats.avg.toLocaleString()}명</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">최대 재환수</p>
                    <p className="text-2xl font-bold">{stats.max.toLocaleString()}명</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patients" className="mt-6">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-9">
              <CardHeader>
                <CardTitle>환자수 분포</CardTitle>
                <CardDescription>지역별 환자 수 분포 (마커)</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <LeafletMap
                  center={[37.5665, 126.9780]}
                  zoom={11}
                  data={getDataForTab()}
                  mode={visualizationMode}
                  onLocationSelect={handleLocationSelect}
                />
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-3">
              <CardHeader>
                <CardTitle>통계</CardTitle>
                <CardDescription>전체 환자수 통계</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">총 환자수</p>
                    <p className="text-2xl font-bold">{stats.total.toLocaleString()}명</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">평균 환자수/지역</p>
                    <p className="text-2xl font-bold">{stats.avg.toLocaleString()}명</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">최대 환자수</p>
                    <p className="text-2xl font-bold">{stats.max.toLocaleString()}명</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recurrence" className="mt-6">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-9">
              <CardHeader>
                <CardTitle>재방문율 분포</CardTitle>
                <CardDescription>지역별 재방문율 분포 (마커)</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <LeafletMap
                  center={[37.5665, 126.9780]}
                  zoom={11}
                  data={getDataForTab()}
                  mode={visualizationMode}
                  onLocationSelect={handleLocationSelect}
                />
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-3">
              <CardHeader>
                <CardTitle>통계</CardTitle>
                <CardDescription>재방문율 통계</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">평균 재방문율</p>
                    <p className="text-2xl font-bold">{stats.avg.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">최고 재방문율</p>
                    <p className="text-2xl font-bold">{stats.max.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">표시 지역수</p>
                    <p className="text-2xl font-bold">{getDataForTab().length}개</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="disease" className="mt-6">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-9">
              <CardHeader>
                <CardTitle>질병별 분포</CardTitle>
                <CardDescription>선택한 질병의 지역별 분포</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isDataLoaded && diseaseOptions.length > 0 ? (
                  <>
                    <Select value={selectedDisease} onValueChange={setSelectedDisease}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="질병을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {diseaseOptions.map((disease) => (
                          <SelectItem key={disease} value={disease}>
                            {disease}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedDisease && diseaseData.length > 0 ? (
                      <LeafletMap
                        center={[37.5665, 126.9780]}
                        zoom={11}
                        data={diseaseData}
                        mode={visualizationMode}
                        onLocationSelect={handleLocationSelect}
                      />
                    ) : (
                      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                        {selectedDisease ? '해당 질병의 데이터가 없습니다' : '위에서 질병을 선택하세요'}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                    데이터를 업로드하세요
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-3">
              <CardHeader>
                <CardTitle>통계</CardTitle>
                <CardDescription>질병별 통계</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDisease ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">선택 질병</p>
                      <p className="text-lg font-bold">{selectedDisease}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">총 환자수</p>
                      <p className="text-2xl font-bold">{stats.total.toLocaleString()}명</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">평균 환자수/지역</p>
                      <p className="text-2xl font-bold">{stats.avg.toLocaleString()}명</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">최대 환자수</p>
                      <p className="text-2xl font-bold">{stats.max.toLocaleString()}명</p>
                    </div>
                    
                    {/* Top 5 지역 리스트 */}
                    {topRegions.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Top 5 지역</p>
                        <div className="space-y-2">
                          {topRegions.map((item) => (
                            <div key={item.region} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.rank}. {item.region}
                              </span>
                              <span className="font-medium">{item.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    질병을 선택하면 통계가 표시됩니다
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="surgery" className="mt-6">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-9">
              <CardHeader>
                <CardTitle>수술별 분포</CardTitle>
                <CardDescription>선택한 수술의 지역별 분포</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isDataLoaded && surgeryOptions.length > 0 ? (
                  <>
                    <Select value={selectedSurgery} onValueChange={setSelectedSurgery}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="수술을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {surgeryOptions.map((surgery) => (
                          <SelectItem key={surgery} value={surgery}>
                            {surgery}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSurgery && surgeryData.length > 0 ? (
                      <LeafletMap
                        center={[37.5665, 126.9780]}
                        zoom={11}
                        data={surgeryData}
                        mode={visualizationMode}
                        onLocationSelect={handleLocationSelect}
                      />
                    ) : (
                      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                        {selectedSurgery ? '해당 수술의 데이터가 없습니다' : '위에서 수술을 선택하세요'}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                    데이터를 업로드하세요
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-3">
              <CardHeader>
                <CardTitle>통계</CardTitle>
                <CardDescription>수술별 통계</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSurgery ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">선택 수술</p>
                      <p className="text-lg font-bold">{selectedSurgery}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">총 수술 건수</p>
                      <p className="text-2xl font-bold">{stats.total.toLocaleString()}건</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">평균 수술/지역</p>
                      <p className="text-2xl font-bold">{stats.avg.toLocaleString()}건</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">최대 수술 건수</p>
                      <p className="text-2xl font-bold">{stats.max.toLocaleString()}건</p>
                    </div>
                    
                    {/* Top 5 지역 리스트 */}
                    {topRegions.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Top 5 지역</p>
                        <div className="space-y-2">
                          {topRegions.map((item) => (
                            <div key={item.region} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.rank}. {item.region}
                              </span>
                              <span className="font-medium">{item.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    수술을 선택하면 통계가 표시됩니다
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="age" className="mt-6">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-9">
              <CardHeader>
                <CardTitle>연령대별 분포</CardTitle>
                <CardDescription>선택한 연령대의 지역별 분포</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isDataLoaded && ageGroupOptions.length > 0 ? (
                  <>
                    <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="연령대를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {ageGroupOptions.map((ageGroup) => (
                          <SelectItem key={ageGroup} value={ageGroup}>
                            {ageGroup}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedAgeGroup && ageGroupData.length > 0 ? (
                      <LeafletMap
                        center={[37.5665, 126.9780]}
                        zoom={11}
                        data={ageGroupData}
                        mode={visualizationMode}
                        onLocationSelect={handleLocationSelect}
                      />
                    ) : (
                      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                        {selectedAgeGroup ? '해당 연령대의 데이터가 없습니다' : '위에서 연령대를 선택하세요'}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                    데이터를 업로드하세요
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-3">
              <CardHeader>
                <CardTitle>통계</CardTitle>
                <CardDescription>연령대별 통계</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAgeGroup ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">선택 연령대</p>
                      <p className="text-lg font-bold">{selectedAgeGroup}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">총 환자수</p>
                      <p className="text-2xl font-bold">{stats.total.toLocaleString()}명</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">평균 환자수/지역</p>
                      <p className="text-2xl font-bold">{stats.avg.toLocaleString()}명</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">최대 환자수</p>
                      <p className="text-2xl font-bold">{stats.max.toLocaleString()}명</p>
                    </div>
                    
                    {/* Top 5 지역 리스트 */}
                    {topRegions.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Top 5 지역</p>
                        <div className="space-y-2">
                          {topRegions.map((item) => (
                            <div key={item.region} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.rank}. {item.region}
                              </span>
                              <span className="font-medium">{item.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    연령대를 선택하면 통계가 표시됩니다
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gender" className="mt-6">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-9">
              <CardHeader>
                <CardTitle>성별 분포</CardTitle>
                <CardDescription>지역별 남성/여성 비율 분포</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isDataLoaded && genderData.length > 0 ? (
                  <LeafletMap
                    center={[37.5665, 126.9780]}
                    zoom={11}
                    data={genderData}
                    mode={visualizationMode}
                    onLocationSelect={handleLocationSelect}
                  />
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                    데이터를 업로드하세요
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-3">
              <CardHeader>
                <CardTitle>통계</CardTitle>
                <CardDescription>성별 분포 통계</CardDescription>
              </CardHeader>
              <CardContent>
                {isDataLoaded && genderData.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">평균 남성 비율</p>
                      <p className="text-2xl font-bold">{stats.avg.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">최대 남성 비율</p>
                      <p className="text-2xl font-bold">{stats.max.toFixed(1)}%</p>
                    </div>
                    
                    {/* Top 5 지역 리스트 (남성 비율 기준) */}
                    {topRegions.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Top 5 지역 (남성 비율)</p>
                        <div className="space-y-2">
                          {topRegions.map((item) => {
                            const regionData = genderData.find((d: any) => d.region === item.region)
                            return (
                              <div key={item.region} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {item.rank}. {item.region}
                                  </span>
                                  <span className="font-medium">{item.value.toFixed(1)}%</span>
                                </div>
                                {regionData && (
                                  <div className="text-xs text-muted-foreground">
                                    남 {regionData.maleCount}명 / 여 {regionData.femaleCount}명
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    데이터를 업로드하세요
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 상세 정보 패널 */}
      {locationDetails && (
        <Card className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-y-auto z-50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background border-b">
            <CardTitle className="text-lg">지역 상세 정보</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedLocation(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <h3 className="text-xl font-bold mb-2">{locationDetails.region}</h3>
            </div>

            {/* 기본 통계 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">총 방문수</p>
                <p className="text-2xl font-bold">{locationDetails.totalPatients.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">고유 환자수</p>
                <p className="text-2xl font-bold">{locationDetails.uniquePatients.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">신환</p>
                <p className="text-2xl font-bold">{locationDetails.newPatients.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">재환</p>
                <p className="text-2xl font-bold">{locationDetails.returningPatients.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">재방문율</p>
                <p className="text-2xl font-bold">{locationDetails.recurrenceRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">평균 연령</p>
                <p className="text-2xl font-bold">{locationDetails.avgAge}세</p>
              </div>
            </div>

            {/* 성별 비율 */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">성별 분포</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">남성</span>
                  <span className="font-medium">{locationDetails.genderCounts.male}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">여성</span>
                  <span className="font-medium">{locationDetails.genderCounts.female}명</span>
                </div>
              </div>
            </div>

            {/* Top 5 질병 */}
            {locationDetails.topDiseases.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Top 5 질병</p>
                <div className="space-y-2">
                  {locationDetails.topDiseases.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {index + 1}. {item.name}
                      </span>
                      <span className="font-medium">{item.count}건</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 5 수술 */}
            {locationDetails.topSurgeries.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Top 5 수술</p>
                <div className="space-y-2">
                  {locationDetails.topSurgeries.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {index + 1}. {item.name}
                      </span>
                      <span className="font-medium">{item.count}건</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 연령대별 분포 */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">연령대별 분포</p>
              <div className="space-y-2">
                {Object.entries(locationDetails.ageGroupCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([ageGroup, count]) => (
                    <div key={ageGroup} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{ageGroup}</span>
                      <span className="font-medium">{count}명</span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

