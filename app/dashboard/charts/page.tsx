'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopDiseasesChart } from '@/components/charts/top-diseases-chart'
import { AgePyramidChart } from '@/components/charts/age-pyramid-chart'
import { MonthlyTrendChart, NewVsReturningChart } from '@/components/charts/monthly-trend-chart'
import { DiseaseSurgeryHeatmap } from '@/components/charts/disease-surgery-heatmap'
import { RetentionChart } from '@/components/charts/retention-chart'
import { useDataStore } from '@/stores/data-store'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'

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

const SAMPLE_DISEASE_SURGERY_MATRIX = {
  columns: ['무릎관절경수술', '척추유합술', '어깨관절경수술', '인공관절치환술'],
  rows: [
    {
      disease: '무릎관절증',
      values: { 무릎관절경수술: 128, 인공관절치환술: 92 } as Record<string, number>,
    },
    {
      disease: '척추관협착증',
      values: { 척추유합술: 115, 어깨관절경수술: 38 } as Record<string, number>,
    },
    {
      disease: '어깨충돌증후군',
      values: { 어깨관절경수술: 64 } as Record<string, number>,
    },
    {
      disease: '퇴행성관절염',
      values: { 무릎관절경수술: 48, 인공관절치환술: 72 } as Record<string, number>,
    },
  ],
  maxValue: 128,
}

const SAMPLE_RETENTION = [
  { bucket: '0-30일', count: 42, percentage: 58.3 },
  { bucket: '31-60일', count: 18, percentage: 25.0 },
  { bucket: '61-90일', count: 9, percentage: 12.5 },
  { bucket: '91-180일', count: 3, percentage: 4.2 },
  { bucket: '181일 이상', count: 0, percentage: 0 },
]

const RETENTION_BUCKETS = [
  { label: '0-30일', min: 0, max: 30 },
  { label: '31-60일', min: 31, max: 60 },
  { label: '61-90일', min: 61, max: 90 },
  { label: '91-180일', min: 91, max: 180 },
  { label: '181일 이상', min: 181, max: Infinity },
]

export default function ChartsPage() {
  const router = useRouter()
  const { diseases, agePyramid, rawData, isDataLoaded, totalPatients, monthlyTrend: storeMonthlyTrend } = useDataStore()

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

  const diseaseSurgeryMatrix = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return SAMPLE_DISEASE_SURGERY_MATRIX
    }

    const diseaseCounts: Record<string, number> = {}
    const surgeryCounts: Record<string, number> = {}
    const matrixCounts: Record<string, Record<string, number>> = {}

    rawData.forEach((patient) => {
      const disease = patient.disease_name
      const surgery = patient.surgery_name
      if (!disease || !surgery) return

      diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1
      surgeryCounts[surgery] = (surgeryCounts[surgery] || 0) + 1

      if (!matrixCounts[disease]) {
        matrixCounts[disease] = {}
      }
      matrixCounts[disease][surgery] = (matrixCounts[disease][surgery] || 0) + 1
    })

    const topDiseases = Object.entries(diseaseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    const topSurgeries = Object.entries(surgeryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    if (topDiseases.length === 0 || topSurgeries.length === 0) {
      return SAMPLE_DISEASE_SURGERY_MATRIX
    }

    const rows = topDiseases.map((disease) => {
      const values: Record<string, number> = {}
      topSurgeries.forEach((surgery) => {
        values[surgery] = matrixCounts[disease]?.[surgery] ?? 0
      })
      return { disease, values }
    })

    const maxValue = rows.reduce((max, row) => {
      const rowMax = Math.max(...Object.values(row.values))
      return Math.max(max, rowMax)
    }, 0)

    return {
      columns: topSurgeries,
      rows,
      maxValue: Math.max(maxValue, 1),
    }
  }, [isDataLoaded, rawData])

  const retentionData = useMemo(() => {
    if (!isDataLoaded || rawData.length === 0) {
      return SAMPLE_RETENTION
    }

    const patientVisits: Record<string, number[]> = {}

    rawData.forEach((patient) => {
      if (!patient.visit_date) return
      const visitDate = new Date(patient.visit_date)
      if (Number.isNaN(visitDate.getTime())) return
      const key = `${patient.name || 'unknown'}|${patient.address || 'unknown'}`
      if (!patientVisits[key]) {
        patientVisits[key] = []
      }
      patientVisits[key].push(visitDate.getTime())
    })

    const bucketCounts = Array(RETENTION_BUCKETS.length).fill(0)
    let totalSecondVisits = 0

    Object.values(patientVisits).forEach((visits) => {
      if (visits.length < 2) return
      const sorted = visits.sort((a, b) => a - b)
      const diffDays = Math.max(
        0,
        Math.round((sorted[1] - sorted[0]) / (1000 * 60 * 60 * 24))
      )
      totalSecondVisits += 1
      let bucketIndex = RETENTION_BUCKETS.findIndex(
        (bucket) => diffDays >= bucket.min && diffDays <= bucket.max
      )
      if (bucketIndex === -1) {
        bucketIndex = RETENTION_BUCKETS.length - 1
      }
      bucketCounts[bucketIndex] += 1
    })

    if (totalSecondVisits === 0) {
      return SAMPLE_RETENTION
    }

    return RETENTION_BUCKETS.map((bucket, index) => ({
      bucket: bucket.label,
      count: bucketCounts[index],
      percentage: Number(((bucketCounts[index] / totalSecondVisits) * 100).toFixed(1)),
    }))
  }, [isDataLoaded, rawData])

  const bestRetentionBucket = useMemo(() => {
    if (!retentionData.length) return null
    return retentionData.reduce((best, current) =>
      current.percentage > best.percentage ? current : best
    )
  }, [retentionData])

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>질병-수술 연관 히트맵</CardTitle>
          </CardHeader>
          <CardContent>
            <DiseaseSurgeryHeatmap
              columns={diseaseSurgeryMatrix.columns}
              rows={diseaseSurgeryMatrix.rows}
              maxValue={diseaseSurgeryMatrix.maxValue}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>재방문 속도 분석</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">가장 빠른 재방문 구간</p>
                <h3 className="text-2xl font-bold mt-1">
                  {bestRetentionBucket?.bucket ?? '데이터 없음'}
                </h3>
                {bestRetentionBucket && (
                  <p className="text-sm text-muted-foreground mt-1">
                    재방문 비율 {bestRetentionBucket.percentage}% ·{' '}
                    {bestRetentionBucket.count.toLocaleString()}명
                  </p>
                )}
              </div>
              <Badge variant="secondary">빠른 재방문</Badge>
            </div>
            <RetentionChart data={retentionData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

