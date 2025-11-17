'use client'

import { useMemo } from 'react'
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
import { useDataStore } from '@/stores/data-store'
import { Users, TrendingUp, Clock, Activity, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const { selectedDiseases, selectedRegions, ageGroups, genders } = useFilterStore()
  const { 
    isDataLoaded, 
    diseases: storeDiseases, 
    mapData: storeMapData,
    agePyramid: storeAgePyramid,
    totalPatients: storeTotalPatients,
    recurrenceRate: storeRecurrenceRate,
    avgInterval: storeAvgInterval,
    totalSurgery: storeTotalSurgery,
    rawData,
  } = useDataStore()

  // 업로드된 데이터가 있으면 사용, 없으면 샘플 데이터 사용
  const diseases = isDataLoaded && storeDiseases.length > 0 ? storeDiseases : SAMPLE_DISEASES
  const mapData = isDataLoaded && storeMapData.length > 0 ? storeMapData : SAMPLE_MAP_DATA
  const agePyramid = isDataLoaded && storeAgePyramid.length > 0 ? storeAgePyramid : SAMPLE_AGE_PYRAMID

  // 수술 데이터 계산
  const surgeryData = (() => {
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

    // 산점도 데이터 (Top 10 수술)
    const scatter = Object.entries(surgeryStats)
      .map(([surgeryName, stats]) => ({
        surgeryName,
        avgAge: stats.ages.reduce((sum, age) => sum + age, 0) / stats.ages.length,
        recurrenceRate: Math.random() * 20 + 35, // 임시: 실제 재방문율 계산 필요
        patientCount: stats.patientKeys.size,
      }))
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
  })()

  // 필터 적용된 데이터 계산
  const getFilteredData = () => {
    let filteredDiseases = [...diseases]
    let filteredMapData = [...mapData]
    
    // 질병 필터 적용
    if (selectedDiseases.length > 0) {
      filteredDiseases = filteredDiseases.filter(d => selectedDiseases.includes(d.name))
    }
    
    // 지역 필터 적용
    if (selectedRegions.length > 0) {
      filteredMapData = filteredMapData.filter(m => selectedRegions.includes(m.region))
    }
    
    return { diseases: filteredDiseases, mapData: filteredMapData }
  }

  const { diseases: filteredDiseases, mapData: filteredMapData } = getFilteredData()

  // 선택된 지역의 Top 5 질병/수술 계산
  const selectedRegionStats = useMemo(() => {
    if (!isDataLoaded || selectedRegions.length === 0 || rawData.length === 0) {
      return { diseases: [], surgeries: [], patientCount: 0 }
    }

    // 선택된 지역의 환자 데이터 필터링
    const regionPatients = rawData.filter(p => selectedRegions.includes(p.region))
    
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
  }, [isDataLoaded, selectedRegions, rawData])

  // KPI 계산
  // 총 환자수는 필터와 무관하게 전체 rawData 기준 (고유 환자 수)
  const totalPatients = isDataLoaded 
    ? storeTotalPatients  // 전체 환자 수 (필터 무관)
    : 1234
    
  const recurrenceRate = isDataLoaded
    ? storeRecurrenceRate.toFixed(1)
    : (filteredMapData.length > 0 
        ? (filteredMapData.reduce((sum, d) => sum + d.value, 0) / filteredMapData.length * 100).toFixed(1)
        : "45.2")
        
  const avgInterval = isDataLoaded ? storeAvgInterval : (selectedRegions.length > 0 ? Math.floor(28 + Math.random() * 10) : 28)
  const totalSurgery = isDataLoaded ? storeTotalSurgery : Math.floor(totalPatients * 0.15)

  return (
    <div className="container mx-auto px-4 py-6 space-y-4" id="dashboard-main">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">환자 데이터 분석툴</h1>
          <p className="text-sm text-muted-foreground">
            통합 환자 데이터 분석 대시보드 v4.1
            {isDataLoaded ? ' (실제 데이터)' : ' (샘플 데이터)'}
            {(selectedDiseases.length > 0 || selectedRegions.length > 0) && 
              ` | 필터 ${selectedDiseases.length + selectedRegions.length}개 적용`}
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

      {/* 필터 패널 */}
      <FilterPanel />

      {/* KPI 카드 - 필터 적용 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
             <Card>
               <CardContent className="p-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-xs text-muted-foreground">총 환자수</p>
                     <p className="text-xl font-bold">{totalPatients.toLocaleString()}</p>
                     <p className="text-[10px] text-muted-foreground mt-0.5">
                       (고유 환자 ID)
                     </p>
                   </div>
                   <Users className="h-6 w-6 text-muted-foreground" />
                 </div>
               </CardContent>
             </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">재방문율</p>
                <p className="text-xl font-bold">{recurrenceRate}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-positive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">평균 간격</p>
                <p className="text-xl font-bold">{avgInterval}일</p>
              </div>
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">총 수술 건수</p>
                <p className="text-xl font-bold">{totalSurgery}건</p>
              </div>
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
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
              <AgePyramidChart data={agePyramid} />
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
            <InteractiveMap data={filteredMapData} mode="markers" />
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
                <MonthlyTrendChart data={SAMPLE_MONTHLY_TREND} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">신규 vs 재방문</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <NewVsReturningChart data={SAMPLE_MONTHLY_TREND} />
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
                <BoundaryComparisonChart data={SAMPLE_BOUNDARY_DATA} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">분포 분석</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <BoxplotChart data={SAMPLE_BOXPLOT_DATA} />
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
