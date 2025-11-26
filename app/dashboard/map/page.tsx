'use client'

import { useState, useMemo } from 'react'
import { LeafletMap } from '@/components/map/leaflet-map'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Map, Layers, Users, Activity, Upload, Flame, Circle, Grid3x3 } from 'lucide-react'
import { useDataStore } from '@/stores/data-store'
import { useRouter } from 'next/navigation'

type VisualizationMode = 'markers' | 'heatmap' | 'cluster' | 'circle'
type AnalysisTab = 'new' | 'returning' | 'patients' | 'recurrence' | 'disease' | 'surgery'

export default function MapPage() {
  const router = useRouter()
  const { mapData, isDataLoaded, rawData, totalPatients } = useDataStore()
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<AnalysisTab>('patients')
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('markers')
  const [selectedDisease, setSelectedDisease] = useState<string>('')
  const [selectedSurgery, setSelectedSurgery] = useState<string>('')

  const handleLocationSelect = (h3Index: string, data: any) => {
    setSelectedLocation({ h3Index, data })
  }

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

    // 선택된 질병의 지역별 집계
    const regionCounts: Record<string, number> = {}
    rawData.forEach(patient => {
      if (patient.disease_name === selectedDisease && patient.region && patient.region !== '미분류') {
        regionCounts[patient.region] = (regionCounts[patient.region] || 0) + 1
      }
    })

    // mapData와 매핑
    return mapData.map(m => ({
      ...m,
      value: regionCounts[m.region] || 0,
    }))
  }, [isDataLoaded, rawData, mapData, selectedDisease])

  // 수술별 분포 데이터 계산
  const surgeryData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0 || !selectedSurgery) {
      return []
    }

    // 선택된 수술의 지역별 집계
    const regionCounts: Record<string, number> = {}
    rawData.forEach(patient => {
      if (patient.surgery_name === selectedSurgery && patient.region && patient.region !== '미분류') {
        regionCounts[patient.region] = (regionCounts[patient.region] || 0) + 1
      }
    })

    // mapData와 매핑
    return mapData.map(m => ({
      ...m,
      value: regionCounts[m.region] || 0,
    }))
  }, [isDataLoaded, rawData, mapData, selectedSurgery])

  // 질병 목록 추출 (Top 20)
  const diseaseOptions = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return []
    }

    const diseaseCounts: Record<string, number> = {}
    rawData.forEach(patient => {
      if (patient.disease_name) {
        diseaseCounts[patient.disease_name] = (diseaseCounts[patient.disease_name] || 0) + 1
      }
    })

    return Object.entries(diseaseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name]) => name)
  }, [isDataLoaded, rawData])

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
  }, [isDataLoaded, rawData])

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
  }, [activeTab, isDataLoaded, mapData, patientTypeData, recurrenceData, diseaseData, surgeryData])

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
        <TabsList className="grid w-full grid-cols-6 mb-6">
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
      </Tabs>
    </div>
  )
}

