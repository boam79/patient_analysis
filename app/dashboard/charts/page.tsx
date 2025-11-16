'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TopDiseasesChart } from '@/components/charts/top-diseases-chart'
import { AgePyramidChart } from '@/components/charts/age-pyramid-chart'
import { MonthlyTrendChart, NewVsReturningChart } from '@/components/charts/monthly-trend-chart'

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

const SAMPLE_SURGERIES = [
  { name: '무릎관절경수술', count: 187, percentage: 28.5 },
  { name: '척추유합술', count: 143, percentage: 21.8 },
  { name: '어깨관절경수술', count: 98, percentage: 14.9 },
  { name: '고관절치환술', count: 76, percentage: 11.6 },
  { name: '슬관절전치환술', count: 65, percentage: 9.9 },
  { name: '발목인대재건술', count: 43, percentage: 6.6 },
  { name: '수근관증후군수술', count: 32, percentage: 4.9 },
  { name: '반월상연골절제술', count: 21, percentage: 3.2 },
  { name: '척추후궁절제술', count: 18, percentage: 2.7 },
  { name: '아킬레스건봉합술', count: 12, percentage: 1.8 },
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
  { month: '7월', recurrenceRate: 47.3, newPatients: 243, returningPatients: 217 },
  { month: '8월', recurrenceRate: 45.9, newPatients: 265, returningPatients: 224 },
  { month: '9월', recurrenceRate: 48.2, newPatients: 289, returningPatients: 269 },
  { month: '10월', recurrenceRate: 49.5, newPatients: 301, returningPatients: 296 },
  { month: '11월', recurrenceRate: 50.3, newPatients: 287, returningPatients: 292 },
  { month: '12월', recurrenceRate: 51.7, newPatients: 254, returningPatients: 272 },
]

export default function ChartsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">데이터 분석 차트</h1>
        <p className="text-muted-foreground">
          환자 데이터를 다양한 차트로 시각화합니다 (샘플 데이터)
        </p>
      </div>

      {/* 좌측 패널 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 질병</CardTitle>
          </CardHeader>
          <CardContent>
            <TopDiseasesChart data={SAMPLE_DISEASES} title="" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 수술</CardTitle>
          </CardHeader>
          <CardContent>
            <TopDiseasesChart data={SAMPLE_SURGERIES} title="" />
          </CardContent>
        </Card>
      </div>

      {/* 연령 피라미드 */}
      <Card>
        <CardHeader>
          <CardTitle>연령 및 성별 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <AgePyramidChart data={SAMPLE_AGE_PYRAMID} />
        </CardContent>
      </Card>

      {/* Trend 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>월별 재방문율 추세</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={SAMPLE_MONTHLY_TREND} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>신규 vs 재방문 환자</CardTitle>
          </CardHeader>
          <CardContent>
            <NewVsReturningChart data={SAMPLE_MONTHLY_TREND} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

