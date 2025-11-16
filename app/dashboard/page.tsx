'use client'

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
import { Users, TrendingUp, Clock, Activity } from 'lucide-react'

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

export default function DashboardPage() {
  const { selectedDiseases, selectedRegions, ageGroups, genders } = useFilterStore()

  // 필터 적용된 데이터 계산
  const getFilteredData = () => {
    let diseases = [...SAMPLE_DISEASES]
    let mapData = [...SAMPLE_MAP_DATA]
    
    // 질병 필터 적용
    if (selectedDiseases.length > 0) {
      diseases = diseases.filter(d => selectedDiseases.includes(d.name))
    }
    
    // 지역 필터 적용
    if (selectedRegions.length > 0) {
      mapData = mapData.filter(m => selectedRegions.includes(m.region))
    }
    
    return { diseases, mapData }
  }

  const { diseases: filteredDiseases, mapData: filteredMapData } = getFilteredData()

  // KPI 계산 (필터 적용됨)
  const totalPatients = filteredDiseases.reduce((sum, d) => sum + d.count, 0) || 1234
  const recurrenceRate = filteredMapData.length > 0 
    ? (filteredMapData.reduce((sum, d) => sum + d.value, 0) / filteredMapData.length * 100).toFixed(1)
    : "45.2"
  const avgInterval = selectedRegions.length > 0 ? Math.floor(28 + Math.random() * 10) : 28
  const totalSurgery = Math.floor(totalPatients * 0.15)

  return (
    <div className="container mx-auto px-4 py-8 space-y-6" id="dashboard-main">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">환자 데이터 분석툴</h1>
          <p className="text-muted-foreground">
            통합 환자 데이터 분석 대시보드 v4.1
            {(selectedDiseases.length > 0 || selectedRegions.length > 0) && 
              ` (필터 ${selectedDiseases.length + selectedRegions.length}개 적용)`}
          </p>
        </div>
        <ExportMenu data={filteredDiseases} />
      </div>

      {/* KPI 카드 - 필터 적용 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">총 환자수</p>
                <p className="text-2xl font-bold">{totalPatients.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">재방문율</p>
                <p className="text-2xl font-bold">{recurrenceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-positive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">평균 간격</p>
                <p className="text-2xl font-bold">{avgInterval}일</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">총 수술 건수</p>
                <p className="text-2xl font-bold">{totalSurgery}건</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 패널 */}
      <FilterPanel />

      {/* 메인 대시보드 */}
      <div className="grid grid-cols-12 gap-4">
        {/* 좌측 패널 */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <Card id="disease-chart">
            <CardHeader>
              <CardTitle>Top 10 질병</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveDiseaseChart data={filteredDiseases} title="" />
            </CardContent>
          </Card>
          <Card id="age-pyramid-chart">
            <CardHeader>
              <CardTitle>연령 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <AgePyramidChart data={SAMPLE_AGE_PYRAMID} />
            </CardContent>
          </Card>
        </div>

        {/* 중앙 지도 */}
        <Card className="col-span-12 lg:col-span-6" id="map-container">
          <CardHeader>
            <CardTitle>
              공간 분석 지도
              {selectedRegions.length > 0 && ` (${selectedRegions.length}개 지역 선택)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InteractiveMap data={filteredMapData} mode="markers" />
          </CardContent>
        </Card>

        {/* 우측 패널 */}
        <Card className="col-span-12 lg:col-span-3">
          <CardHeader>
            <CardTitle>선택 영역 정보</CardTitle>
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

        <TabsContent value="trend" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>월별 추세</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyTrendChart data={SAMPLE_MONTHLY_TREND} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>신규 vs 재방문</CardTitle>
              </CardHeader>
              <CardContent>
                <NewVsReturningChart data={SAMPLE_MONTHLY_TREND} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="boundary" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>지역 비교</CardTitle>
              </CardHeader>
              <CardContent>
                <BoundaryComparisonChart data={SAMPLE_BOUNDARY_DATA} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>분포 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <BoxplotChart data={SAMPLE_BOXPLOT_DATA} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>데이터 테이블</CardTitle>
              <p className="text-sm text-muted-foreground">
                전체 {filteredDiseases.length}개 질병 데이터
              </p>
            </CardHeader>
            <CardContent>
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

        <TabsContent value="surgery" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>수술별 산점도</CardTitle>
              </CardHeader>
              <CardContent>
                <SurgeryScatterChart data={SAMPLE_SURGERY_SCATTER} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>수술-질병 연관</CardTitle>
              </CardHeader>
              <CardContent>
                <SurgeryDiseaseMatrix
                  data={SAMPLE_SURGERY_MATRIX}
                  diseases={['무릎관절증', '척추관협착증', '고혈압']}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
