'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { MapPin, TrendingUp, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { extractMonth } from '@/lib/utils/date-helpers'
import { resolvePatientId, groupVisitsByPatient } from '@/lib/utils/patient-identity'
import {
  isReturningWithinWindow,
  DEFAULT_STRATEGY_WINDOW,
} from '@/lib/utils/strategy-metrics'

interface RegionalMarketAnalysisProps {
  data: PatientData[]
  windowSize?: number
}

export function RegionalMarketAnalysis({
  data,
  windowSize = DEFAULT_STRATEGY_WINDOW,
}: RegionalMarketAnalysisProps) {
  const analysis = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        regionStats: [],
        growthByRegion: [],
        newPatientByRegion: [],
        marketShare: [],
      }
    }

    const regionStats = new Map<
      string,
      {
        total: number
        unique: Set<string>
        newPatients: Set<string>
        multiVisitPatients: Set<string>
      }
    >()

    const patientFirstVisitInRegion = new Map<string, Map<string, string>>()
    const patientRegions = new Map<string, Set<string>>()

    data.forEach((p) => {
      if (!p.region) return

      const id = resolvePatientId(p)

      if (!regionStats.has(p.region)) {
        regionStats.set(p.region, {
          total: 0,
          unique: new Set(),
          newPatients: new Set(),
          multiVisitPatients: new Set(),
        })
        patientFirstVisitInRegion.set(p.region, new Map())
      }

      const stats = regionStats.get(p.region)!
      stats.total++
      stats.unique.add(id)

      const regionFirstVisit = patientFirstVisitInRegion.get(p.region)!
      if (!regionFirstVisit.has(id)) {
        regionFirstVisit.set(id, p.visit_date)
        stats.newPatients.add(id)
      } else {
        stats.multiVisitPatients.add(id)
      }

      if (!patientRegions.has(id)) {
        patientRegions.set(id, new Set())
      }
      patientRegions.get(id)!.add(p.region)
    })

    // 윈도우 재방문: 지역 내 방문만으로 판정
    const visitsByPatient = groupVisitsByPatient(data)
    const windowReturningByRegion = new Map<string, { total: number; returning: number }>()

    visitsByPatient.forEach((visits) => {
      const byRegion = new Map<string, PatientData[]>()
      visits.forEach((v) => {
        if (!v.region) return
        const list = byRegion.get(v.region) ?? []
        list.push(v)
        byRegion.set(v.region, list)
      })
      byRegion.forEach((regionVisits, region) => {
        if (!windowReturningByRegion.has(region)) {
          windowReturningByRegion.set(region, { total: 0, returning: 0 })
        }
        const s = windowReturningByRegion.get(region)!
        s.total++
        if (isReturningWithinWindow(regionVisits, windowSize)) s.returning++
      })
    })

    const regionStatsArray = Array.from(regionStats.entries())
      .map(([region, stats]) => {
        const win = windowReturningByRegion.get(region)
        return {
          region,
          totalVisits: stats.total,
          uniquePatients: stats.unique.size,
          newPatients: stats.newPatients.size,
          multiVisitPatients: stats.multiVisitPatients.size,
          multiVisitRate:
            stats.unique.size > 0
              ? (stats.multiVisitPatients.size / stats.unique.size) * 100
              : 0,
          windowRetentionRate:
            win && win.total > 0 ? (win.returning / win.total) * 100 : 0,
          avgVisitsPerPatient:
            stats.unique.size > 0 ? stats.total / stats.unique.size : 0,
        }
      })
      .sort((a, b) => b.totalVisits - a.totalVisits)

    const monthlyRegionData = new Map<string, Map<string, number>>()
    data.forEach((p) => {
      if (!p.region) return
      const month = extractMonth(p.visit_date)
      if (month) {
        if (!monthlyRegionData.has(p.region)) {
          monthlyRegionData.set(p.region, new Map())
        }
        const monthData = monthlyRegionData.get(p.region)!
        monthData.set(month, (monthData.get(month) || 0) + 1)
      }
    })

    const growthByRegion = Array.from(monthlyRegionData.entries())
      .map(([region, monthData]) => {
        const months = Array.from(monthData.entries()).sort()
        if (months.length < 2) return null

        const lastMonth = months[months.length - 1][1]
        const prevMonth = months[months.length - 2][1]
        const growthRate = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0

        return {
          region,
          growthRate,
          lastMonthCount: lastMonth,
          prevMonthCount: prevMonth,
        }
      })
      .filter((item) => item !== null)
      .sort((a, b) => (b?.growthRate || 0) - (a?.growthRate || 0))

    const totalVisits = data.length
    const marketShare = regionStatsArray.map((stat) => ({
      region: stat.region,
      share: totalVisits > 0 ? (stat.totalVisits / totalVisits) * 100 : 0,
      visits: stat.totalVisits,
    }))

    return {
      regionStats: regionStatsArray,
      growthByRegion: growthByRegion as Array<{
        region: string
        growthRate: number
        lastMonthCount: number
        prevMonthCount: number
      }>,
      newPatientByRegion: regionStatsArray.map((stat) => ({
        region: stat.region,
        newPatients: stat.newPatients,
        multiVisitPatients: stat.multiVisitPatients,
      })),
      marketShare,
    }
  }, [data, windowSize])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주요 지역 수</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.regionStats.length}</div>
            <p className="text-xs text-muted-foreground">활성 지역 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 성장 지역</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analysis.growthByRegion.length > 0 && analysis.growthByRegion[0].growthRate > 0
                ? `+${analysis.growthByRegion[0].growthRate.toFixed(1)}%`
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.growthByRegion.length > 0 && analysis.growthByRegion[0].growthRate > 0
                ? analysis.growthByRegion[0].region
                : '성장 지역 없음'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최대 시장 점유율</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis.marketShare.length > 0 ? analysis.marketShare[0].share.toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.marketShare.length > 0 ? analysis.marketShare[0].region : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>지역별 상세 통계</CardTitle>
          <p className="text-xs text-muted-foreground">
            다회 방문 = 지역 내 2회+ · 윈도우 재방문율 = {windowSize}일(지역 내 방문)
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">지역</th>
                  <th className="p-2 text-right">총 방문</th>
                  <th className="p-2 text-right">고유 환자</th>
                  <th className="p-2 text-right">지역 신규</th>
                  <th className="p-2 text-right">다회 방문</th>
                  <th className="p-2 text-right">다회 방문율</th>
                  <th className="p-2 text-right">윈도우 재방문율</th>
                  <th className="p-2 text-right">평균 방문</th>
                </tr>
              </thead>
              <tbody>
                {analysis.regionStats.slice(0, 10).map((stat) => (
                  <tr key={stat.region} className="border-b">
                    <td className="p-2 font-medium">{stat.region}</td>
                    <td className="p-2 text-right">{stat.totalVisits.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.uniquePatients.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.newPatients.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.multiVisitPatients.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.multiVisitRate.toFixed(1)}%</td>
                    <td className="p-2 text-right">{stat.windowRetentionRate.toFixed(1)}%</td>
                    <td className="p-2 text-right">{stat.avgVisitsPerPatient.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {analysis.marketShare.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>지역별 시장 점유율</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.marketShare.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" angle={-20} textAnchor="end" height={70} fontSize={11} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="share" fill="hsl(var(--chart-1))" name="점유율 (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {analysis.growthByRegion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>지역별 성장률 Top 10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.growthByRegion.slice(0, 10).map((item, index) => (
                <div
                  key={item.region}
                  className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {index + 1}. {item.region}
                  </span>
                  <span
                    className={
                      item.growthRate >= 0 ? 'font-medium text-positive' : 'font-medium text-destructive'
                    }
                  >
                    {item.growthRate >= 0 ? '+' : ''}
                    {item.growthRate.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
