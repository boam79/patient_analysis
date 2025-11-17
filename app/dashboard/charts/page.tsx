'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopDiseasesChart } from '@/components/charts/top-diseases-chart'
import { AgePyramidChart } from '@/components/charts/age-pyramid-chart'
import { MonthlyTrendChart, NewVsReturningChart } from '@/components/charts/monthly-trend-chart'
import { useDataStore } from '@/stores/data-store'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'

export default function ChartsPage() {
  const router = useRouter()
  const { diseases, agePyramid, rawData, isDataLoaded, totalPatients, monthlyTrend: storeMonthlyTrend } = useDataStore()

  // 샘플 데이터 (데이터가 없을 때)
  const SAMPLE_DISEASES = [
    { name: '무릎관절증', count: 324, percentage: 26.2 },
    { name: '척추관협착증', count: 287, percentage: 23.3 },
    { name: '고혈압', count: 198, percentage: 16.0 },
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

  const SAMPLE_MONTHLY_TREND = [
    { month: '1월', recurrenceRate: 38.2, newPatients: 234, returningPatients: 145 },
    { month: '2월', recurrenceRate: 41.5, newPatients: 198, returningPatients: 140 },
    { month: '3월', recurrenceRate: 43.8, newPatients: 287, returningPatients: 223 },
    { month: '4월', recurrenceRate: 45.2, newPatients: 312, returningPatients: 260 },
    { month: '5월', recurrenceRate: 44.7, newPatients: 298, returningPatients: 243 },
    { month: '6월', recurrenceRate: 46.1, newPatients: 276, returningPatients: 235 },
  ]

  // 수술 통계 계산
  const surgeryStats = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return [
        { name: '무릎관절경수술', count: 187, percentage: 28.5 },
        { name: '척추유합술', count: 143, percentage: 21.8 },
        { name: '어깨관절경수술', count: 98, percentage: 14.9 },
      ]
    }

    const surgeryCounts = rawData
      .filter(p => p.surgery_name)
      .reduce((acc, patient) => {
        const surgery = patient.surgery_name!
        acc[surgery] = (acc[surgery] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const totalSurgeries = Object.values(surgeryCounts).reduce((sum, count) => sum + count, 0)

    return Object.entries(surgeryCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalSurgeries > 0 ? (count / totalSurgeries) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [isDataLoaded, rawData])

  // 월별 추세 데이터 (data-store에서 가져오기)
  const monthlyTrend = useMemo(() => {
    if (!isDataLoaded || storeMonthlyTrend.length === 0) {
      return SAMPLE_MONTHLY_TREND
    }
    return storeMonthlyTrend
  }, [isDataLoaded, storeMonthlyTrend])

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">데이터 분석 차트</h1>
          <p className="text-muted-foreground">
            환자 데이터를 다양한 차트로 시각화합니다
            {isDataLoaded ? ` (실제 데이터 ${totalPatients.toLocaleString()}명)` : ' (샘플 데이터)'}
          </p>
        </div>
        {!isDataLoaded && (
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/upload')}>
            <Upload className="h-4 w-4 mr-2" />
            데이터 업로드
          </Button>
        )}
      </div>

      {/* 좌측 패널 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 질병</CardTitle>
          </CardHeader>
          <CardContent>
            <TopDiseasesChart 
              data={isDataLoaded && diseases.length > 0 ? diseases : SAMPLE_DISEASES} 
              title="" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 수술</CardTitle>
          </CardHeader>
          <CardContent>
            <TopDiseasesChart data={surgeryStats} title="" />
          </CardContent>
        </Card>
      </div>

      {/* 연령 피라미드 */}
      <Card>
        <CardHeader>
          <CardTitle>연령 및 성별 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <AgePyramidChart 
            data={isDataLoaded && agePyramid.length > 0 ? agePyramid : SAMPLE_AGE_PYRAMID} 
          />
        </CardContent>
      </Card>

      {/* Trend 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>월별 재방문율 추세</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={monthlyTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>신규 vs 재방문 환자</CardTitle>
          </CardHeader>
          <CardContent>
            <NewVsReturningChart data={monthlyTrend} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

