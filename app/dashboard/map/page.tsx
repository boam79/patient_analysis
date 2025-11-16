'use client'

import { useState } from 'react'
import { LeafletMap } from '@/components/map/leaflet-map'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Map, Layers, Users, Activity } from 'lucide-react'

// 샘플 데이터 (실제로는 DuckDB에서 가져옴)
const SAMPLE_DATA = [
  { latitude: 37.5665, longitude: 126.9780, value: 0.8 }, // 서울 중심
  { latitude: 37.5700, longitude: 126.9850, value: 0.6 }, // 동대문
  { latitude: 37.5550, longitude: 126.9700, value: 0.9 }, // 용산
  { latitude: 37.5800, longitude: 127.0000, value: 0.7 }, // 성동
  { latitude: 37.5500, longitude: 127.0500, value: 0.5 }, // 강남
]

export default function MapPage() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'new' | 'returning' | 'patients' | 'recurrence'>('new')

  const handleLocationSelect = (h3Index: string, data: any) => {
    setSelectedLocation({ h3Index, data })
  }

  // 각 탭에 맞는 데이터 생성 (모두 마커 모드)
  const getDataForTab = () => {
    switch(activeTab) {
      case 'new':
        // 신환 데이터
        return SAMPLE_DATA.map(d => ({ ...d, value: d.value * 80, label: '신환' }))
      case 'returning':
        // 재환 데이터
        return SAMPLE_DATA.map(d => ({ ...d, value: d.value * 50, label: '재환' }))
      case 'patients':
        // 환자수 데이터
        return SAMPLE_DATA.map(d => ({ ...d, value: d.value * 100, label: '환자수' }))
      case 'recurrence':
        // 재방문율 데이터
        return SAMPLE_DATA.map(d => ({ ...d, value: d.value, label: '재방문율' }))
      default:
        return SAMPLE_DATA
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">공간 분석 지도</h1>
          <p className="text-muted-foreground">
            OpenStreetMap 기반 환자 분포 마커 (1개 지역 선택)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Map className="h-3 w-3 mr-1" />
            OpenStreetMap
          </Badge>
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {SAMPLE_DATA.length} 포인트
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
                  data={SAMPLE_DATA.map(d => ({ ...d, value: d.value * 80 }))}
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
                    <p className="text-2xl font-bold">687명</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">평균 신환/지역</p>
                    <p className="text-2xl font-bold">137명</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">신환 비율</p>
                    <p className="text-2xl font-bold">55.7%</p>
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
                  data={SAMPLE_DATA.map(d => ({ ...d, value: d.value * 50 }))}
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
                    <p className="text-2xl font-bold">547명</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">평균 재환/지역</p>
                    <p className="text-2xl font-bold">109명</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">재환 비율</p>
                    <p className="text-2xl font-bold">44.3%</p>
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
                  data={SAMPLE_DATA.map(d => ({ ...d, value: d.value * 100 }))}
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
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">평균 환자수/지역</p>
                    <p className="text-2xl font-bold">247</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">최대 환자수</p>
                    <p className="text-2xl font-bold">412</p>
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
                  data={SAMPLE_DATA.map(d => ({ ...d, value: d.value * 0.45 }))}
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
                    <p className="text-2xl font-bold">45.2%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">최고 재방문율</p>
                    <p className="text-2xl font-bold">72.3%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">최저 재방문율</p>
                    <p className="text-2xl font-bold">28.1%</p>
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

