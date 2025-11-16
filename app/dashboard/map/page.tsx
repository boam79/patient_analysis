'use client'

import { useState, useMemo } from 'react'
import { LeafletMap } from '@/components/map/leaflet-map'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Map, Layers, Users, Activity, Upload } from 'lucide-react'
import { useDataStore } from '@/stores/data-store'
import { useRouter } from 'next/navigation'

export default function MapPage() {
  const router = useRouter()
  const { mapData, isDataLoaded, rawData, totalPatients } = useDataStore()
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'new' | 'returning' | 'patients' | 'recurrence'>('patients')

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

  // 신환/재환 계산
  const patientTypeData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return {
        newPatients: SAMPLE_DATA.map(d => ({ ...d, value: d.value * 0.6 })),
        returningPatients: SAMPLE_DATA.map(d => ({ ...d, value: d.value * 0.4 })),
      }
    }

    // 환자별 방문 횟수 계산
    const patientVisits = new Map<string, number>()
    rawData.forEach(patient => {
      const visits = patientVisits.get(patient.patient_id) || 0
      patientVisits.set(patient.patient_id, visits + 1)
    })

    // 지역별 신환/재환 집계
    const regionNewCount = new Map<string, number>()
    const regionReturningCount = new Map<string, number>()

    rawData.forEach(patient => {
      const isNew = patientVisits.get(patient.patient_id) === 1
      if (isNew) {
        const count = regionNewCount.get(patient.region) || 0
        regionNewCount.set(patient.region, count + 1)
      } else {
        const count = regionReturningCount.get(patient.region) || 0
        regionReturningCount.set(patient.region, count + 1)
      }
    })

    // 지도 데이터와 매핑
    const newPatients = mapData.map(m => ({
      ...m,
      value: regionNewCount.get(m.region) || 0,
    }))

    const returningPatients = mapData.map(m => ({
      ...m,
      value: regionReturningCount.get(m.region) || 0,
    }))

    return { newPatients, returningPatients }
  }, [isDataLoaded, rawData, mapData])

  // 재방문율 계산
  const recurrenceData = useMemo(() => {
    if (!isDataLoaded || mapData.length === 0) {
      return SAMPLE_DATA.map(d => ({ ...d, value: d.value * 0.45 }))
    }

    const totalNew = patientTypeData.newPatients.reduce((sum, d) => sum + d.value, 0)
    const totalReturning = patientTypeData.returningPatients.reduce((sum, d) => sum + d.value, 0)
    const totalAll = totalNew + totalReturning

    return mapData.map(m => ({
      ...m,
      value: totalAll > 0 ? (m.value / totalAll) * 100 : 0, // 재방문율 %
    }))
  }, [isDataLoaded, mapData, patientTypeData])

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
      default:
        return mapData
    }
  }

  // 통계 계산
  const stats = useMemo(() => {
    const data = getDataForTab()
    const total = data.reduce((sum, d) => sum + d.value, 0)
    const avg = data.length > 0 ? Math.round(total / data.length) : 0
    const max = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0

    return { total, avg, max }
  }, [activeTab, isDataLoaded, mapData, patientTypeData, recurrenceData])

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

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
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
                  mode="markers"
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
                  mode="markers"
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
                  mode="markers"
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
                  mode="markers"
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
      </Tabs>
    </div>
  )
}

