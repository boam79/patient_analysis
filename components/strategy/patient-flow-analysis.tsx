'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { Users, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { parseDate } from '@/lib/utils/date-helpers'
import { resolvePatientId } from '@/lib/utils/patient-identity'

interface PatientFlowAnalysisProps {
  data: PatientData[]
}

export function PatientFlowAnalysis({ data }: PatientFlowAnalysisProps) {
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

    // 환자별 방문 횟수
    const patientVisitCounts = new Map<string, number>()
    const patientFirstVisit = new Map<string, string>()
    const patientLastVisit = new Map<string, string>()
    const patientDiseases = new Map<string, Set<string>>()
    const patientRegions = new Map<string, Set<string>>()

    data.forEach(p => {
      const id = resolvePatientId(p)
      const count = (patientVisitCounts.get(id) || 0) + 1
      patientVisitCounts.set(id, count)
      
      if (!patientFirstVisit.has(id)) {
        patientFirstVisit.set(id, p.visit_date)
      }
      // 마지막 방문일 업데이트 (날짜 비교)
      const currentLastVisit = patientLastVisit.get(id)
      if (!currentLastVisit || (parseDate(p.visit_date) && parseDate(currentLastVisit) && parseDate(p.visit_date)! > parseDate(currentLastVisit)!)) {
        patientLastVisit.set(id, p.visit_date)
      }
      
      if (!patientDiseases.has(id)) {
        patientDiseases.set(id, new Set())
      }
      patientDiseases.get(id)!.add(p.disease_name)
      
      if (!patientRegions.has(id)) {
        patientRegions.set(id, new Set())
      }
      if (p.region) {
        patientRegions.get(id)!.add(p.region)
      }
    })

    // 환자 여정 분석 (1회, 2회, 3회, 4회, 5회 이상)
    const journeyMap = new Map<string, number>()
    patientVisitCounts.forEach((count, patientId) => {
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

    // 질병별 재방문율
    const diseaseRetention = new Map<string, { total: number; returning: number }>()
    patientVisitCounts.forEach((count, patientId) => {
      const diseases = patientDiseases.get(patientId) || new Set()
      diseases.forEach(disease => {
        if (!diseaseRetention.has(disease)) {
          diseaseRetention.set(disease, { total: 0, returning: 0 })
        }
        const stats = diseaseRetention.get(disease)!
        stats.total++
        if (count > 1) {
          stats.returning++
        }
      })
    })

    const retentionByDisease = Array.from(diseaseRetention.entries())
      .map(([disease, stats]) => ({
        disease,
        retentionRate: stats.total > 0 ? (stats.returning / stats.total) * 100 : 0,
        total: stats.total,
        returning: stats.returning,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    // 지역별 재방문율
    const regionRetention = new Map<string, { total: number; returning: number }>()
    patientVisitCounts.forEach((count, patientId) => {
      const regions = patientRegions.get(patientId) || new Set()
      regions.forEach(region => {
        if (!regionRetention.has(region)) {
          regionRetention.set(region, { total: 0, returning: 0 })
        }
        const stats = regionRetention.get(region)!
        stats.total++
        if (count > 1) {
          stats.returning++
        }
      })
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

    // 이탈 환자 분석 (1회 방문만)
    const churnedPatients = Array.from(patientVisitCounts.entries())
      .filter(([_, count]) => count === 1)
      .map(([patientId, _]) => patientId)

    const churnedByDisease = new Map<string, number>()
    const churnedByRegion = new Map<string, number>()

    churnedPatients.forEach(patientId => {
      const diseases = patientDiseases.get(patientId) || new Set()
      diseases.forEach(disease => {
        churnedByDisease.set(disease, (churnedByDisease.get(disease) || 0) + 1)
      })
      
      const regions = patientRegions.get(patientId) || new Set()
      regions.forEach(region => {
        churnedByRegion.set(region, (churnedByRegion.get(region) || 0) + 1)
      })
    })

    const totalPatients = patientVisitCounts.size
    const churnRate = totalPatients > 0 ? (churnedPatients.length / totalPatients) * 100 : 0

    return {
      patientJourney,
      visitDistribution,
      retentionByDisease,
      retentionByRegion,
      churnAnalysis: {
        totalChurned: churnedPatients.length,
        churnRate,
        churnedByDisease: Array.from(churnedByDisease.entries())
          .map(([disease, count]) => ({ disease, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        churnedByRegion: Array.from(churnedByRegion.entries())
          .map(([region, count]) => ({ region, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      },
    }
  }, [data])

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
            <CardTitle className="text-sm font-medium">재방문 환자</CardTitle>
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
              2회 이상 방문한 환자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이탈률</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {flowAnalysis.churnAnalysis.churnRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {flowAnalysis.churnAnalysis.totalChurned.toLocaleString()}명 이탈
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
          <CardTitle>질병별 재방문율 Top 10</CardTitle>
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
          <CardTitle>지역별 재방문율 Top 10</CardTitle>
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

