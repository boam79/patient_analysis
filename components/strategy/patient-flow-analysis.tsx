'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { Users, TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { parseDate } from '@/lib/utils/date-helpers'
import { groupVisitsByPatient } from '@/lib/utils/patient-identity'
import { computeDiseaseRecurrenceStats } from '@/lib/utils/monthly-trend'
import {
  computeRetentionSummary,
  isReturningWithinWindow,
  DEFAULT_STRATEGY_WINDOW,
} from '@/lib/utils/strategy-metrics'

interface PatientFlowAnalysisProps {
  data: PatientData[]
  windowSize?: number
}

export function PatientFlowAnalysis({
  data,
  windowSize = DEFAULT_STRATEGY_WINDOW,
}: PatientFlowAnalysisProps) {
  // 환자 유입/유지 분석
  const flowAnalysis = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        patientJourney: [],
        visitDistribution: [],
        retentionByDisease: [],
        retentionByRegion: [],
        churnAnalysis: {
          totalChurned: 0,
          churnRate: 0,
          churnedByDisease: [],
          churnedByRegion: [],
        },
      }
    }

    const visitsByPatient = groupVisitsByPatient(data)
    const retention = computeRetentionSummary(data, windowSize)

    const patientVisitCounts = new Map<string, number>()
    const patientFirstVisit = new Map<string, string>()
    const patientLastVisit = new Map<string, string>()
    const patientDiseases = new Map<string, Set<string>>()
    const patientRegions = new Map<string, Set<string>>()

    visitsByPatient.forEach((visits, id) => {
      patientVisitCounts.set(id, visits.length)
      patientFirstVisit.set(id, visits[0].visit_date)
      patientLastVisit.set(id, visits[visits.length - 1].visit_date)
      const diseases = new Set<string>()
      const regions = new Set<string>()
      visits.forEach((p) => {
        if (p.disease_name) diseases.add(p.disease_name)
        if (p.region) regions.add(p.region)
      })
      patientDiseases.set(id, diseases)
      patientRegions.set(id, regions)
    })

    // 환자 여정 분석 (1회, 2회, 3회, 4회, 5회 이상)
    const journeyMap = new Map<string, number>()
    patientVisitCounts.forEach((count) => {
      let category = ''
      if (count === 1) category = '1회 방문'
      else if (count === 2) category = '2회 방문'
      else if (count === 3) category = '3회 방문'
      else if (count === 4) category = '4회 방문'
      else category = '5회 이상'
      
      journeyMap.set(category, (journeyMap.get(category) || 0) + 1)
    })

    const patientJourney = Array.from(journeyMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => {
        const order = ['1회 방문', '2회 방문', '3회 방문', '4회 방문', '5회 이상']
        return order.indexOf(a.category) - order.indexOf(b.category)
      })

    // 방문 횟수 분포
    const visitDistribution = Array.from({ length: 10 }, (_, i) => {
      const visitCount = i + 1
      const count = Array.from(patientVisitCounts.values()).filter(v => v === visitCount).length
      return { visits: visitCount, patients: count }
    })

    // 질병별 재방문율 (윈도우 · 해당 질병 방문 환자 = 분모)
    const retentionByDisease = computeDiseaseRecurrenceStats(data, windowSize)
      .slice(0, 10)
      .map((s) => ({
        disease: s.disease,
        retentionRate: s.rate,
        total: s.total,
        returning: s.returning,
      }))

    // 지역별 재방문율 (윈도우 · 첫 방문 지역 귀속)
    const regionRetention = new Map<string, { total: number; returning: number }>()
    visitsByPatient.forEach((visits) => {
      const region = visits[0]?.region
      if (!region) return
      if (!regionRetention.has(region)) {
        regionRetention.set(region, { total: 0, returning: 0 })
      }
      const stats = regionRetention.get(region)!
      stats.total++
      if (isReturningWithinWindow(visits, windowSize)) {
        stats.returning++
      }
    })

    const retentionByRegion = Array.from(regionRetention.entries())
      .map(([region, stats]) => ({
        region,
        retentionRate: stats.total > 0 ? (stats.returning / stats.total) * 100 : 0,
        total: stats.total,
        returning: stats.returning,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // 이탈(1회 방문만) — 방문 횟수 기준 유지 (윈도우와 별개 지표)
    const churnedIds: string[] = []
    patientVisitCounts.forEach((count, id) => {
      if (count === 1) churnedIds.push(id)
    })
    const totalChurned = churnedIds.length
    const churnRate =
      patientVisitCounts.size > 0
        ? (totalChurned / patientVisitCounts.size) * 100
        : 0

    const churnedByDiseaseMap = new Map<string, number>()
    const churnedByRegionMap = new Map<string, number>()
    churnedIds.forEach((id) => {
      const disease = Array.from(patientDiseases.get(id) || [])[0]
      const region = Array.from(patientRegions.get(id) || [])[0]
      if (disease) {
        churnedByDiseaseMap.set(disease, (churnedByDiseaseMap.get(disease) || 0) + 1)
      }
      if (region) {
        churnedByRegionMap.set(region, (churnedByRegionMap.get(region) || 0) + 1)
      }
    })

    return {
      patientJourney,
      visitDistribution,
      retentionByDisease,
      retentionByRegion,
      churnAnalysis: {
        totalChurned,
        churnRate,
        churnedByDisease: Array.from(churnedByDiseaseMap.entries())
          .map(([disease, count]) => ({ disease, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        churnedByRegion: Array.from(churnedByRegionMap.entries())
          .map(([region, count]) => ({ region, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      },
      windowRetentionRate: retention.retentionRate,
    }
  }, [data, windowSize])

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">신규 환자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flowAnalysis.patientJourney.find(j => j.category === '1회 방문')?.count.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              1회 방문만 한 환자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">다회 방문 환자</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {flowAnalysis.patientJourney
                .filter(j => j.category !== '1회 방문')
                .reduce((sum, j) => sum + j.count, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              2회+ 방문(다회) · 별도 지표: 윈도우 재방문율{' '}
              {(flowAnalysis.windowRetentionRate ?? 0).toFixed(1)}% ({windowSize}일)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">1회만 방문 비율</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {flowAnalysis.churnAnalysis.churnRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {flowAnalysis.churnAnalysis.totalChurned.toLocaleString()}명 · 방문 1회만(윈도우와 별개)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 환자 여정 분석 */}
      <Card>
        <CardHeader>
          <CardTitle>환자 여정 분석</CardTitle>
        </CardHeader>
        <CardContent>
          {flowAnalysis.patientJourney.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={flowAnalysis.patientJourney}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="환자 수" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 방문 횟수 분포 */}
      <Card>
        <CardHeader>
          <CardTitle>방문 횟수 분포</CardTitle>
        </CardHeader>
        <CardContent>
          {flowAnalysis.visitDistribution.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={flowAnalysis.visitDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="visits" label={{ value: '방문 횟수', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: '환자 수', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="patients" stroke="#82ca9d" name="환자 수" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 질병별 재방문율 */}
      <Card>
        <CardHeader>
          <CardTitle>질병별 재방문율 Top 10 ({windowSize}일)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flowAnalysis.retentionByDisease.map((item, index) => (
              <div key={item.disease} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium flex-1">{item.disease}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${item.retentionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-20 text-right">
                    {item.retentionRate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    ({item.returning}/{item.total})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 지역별 재방문율 */}
      <Card>
        <CardHeader>
          <CardTitle>지역별 재방문율 Top 10 ({windowSize}일 · 첫 방문 지역)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flowAnalysis.retentionByRegion.map((item, index) => (
              <div key={item.region} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium flex-1">{item.region}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${item.retentionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-20 text-right">
                    {item.retentionRate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    ({item.returning}/{item.total})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 이탈 환자 분석 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>이탈 환자 - 질병별</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flowAnalysis.churnAnalysis.churnedByDisease.map((item, index) => (
                <div key={item.disease} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.disease}</span>
                  <span className="text-muted-foreground">{item.count}명</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>이탈 환자 - 지역별</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flowAnalysis.churnAnalysis.churnedByRegion.map((item, index) => (
                <div key={item.region} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.region}</span>
                  <span className="text-muted-foreground">{item.count}명</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

