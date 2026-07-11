'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { MapPin, TrendingUp, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { extractMonth } from '@/lib/utils/date-helpers'
import { resolvePatientId } from '@/lib/utils/patient-identity'

interface RegionalMarketAnalysisProps {
  data: PatientData[]
}

export function RegionalMarketAnalysis({ data }: RegionalMarketAnalysisProps) {
  const analysis = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        regionStats: [],
        growthByRegion: [],
        newPatientByRegion: [],
        marketShare: [],
      }
    }

    // 지역별 통계
    const regionStats = new Map<string, {
      total: number
      unique: Set<string>
      newPatients: Set<string>
      returningPatients: Set<string>
    }>()

    // 지역별 첫 방문 기록 (각 지역에서의 첫 방문을 기준으로 계산)
    const patientFirstVisitInRegion = new Map<string, Map<string, string>>()
    const patientRegions = new Map<string, Set<string>>()

    data.forEach(p => {
      if (!p.region) return

      const id = resolvePatientId(p)

      if (!regionStats.has(p.region)) {
        regionStats.set(p.region, {
          total: 0,
          unique: new Set(),
          newPatients: new Set(),
          returningPatients: new Set(),
        })
        patientFirstVisitInRegion.set(p.region, new Map())
      }

      const stats = regionStats.get(p.region)!
      stats.total++
      stats.unique.add(id)

      // 해당 지역에서의 첫 방문인지 확인
      const regionFirstVisit = patientFirstVisitInRegion.get(p.region)!
      if (!regionFirstVisit.has(id)) {
        regionFirstVisit.set(id, p.visit_date)
        stats.newPatients.add(id)
      } else {
        stats.returningPatients.add(id)
      }

      if (!patientRegions.has(id)) {
        patientRegions.set(id, new Set())
      }
      patientRegions.get(id)!.add(p.region)
    })

    // 지역별 통계 배열
    const regionStatsArray = Array.from(regionStats.entries())
      .map(([region, stats]) => ({
        region,
        totalVisits: stats.total,
        uniquePatients: stats.unique.size,
        newPatients: stats.newPatients.size,
        returningPatients: stats.returningPatients.size,
        retentionRate: stats.unique.size > 0 
          ? (stats.returningPatients.size / stats.unique.size) * 100 
          : 0,
        avgVisitsPerPatient: stats.unique.size > 0 
          ? stats.total / stats.unique.size 
          : 0,
      }))
      .sort((a, b) => b.totalVisits - a.totalVisits)

    // 월별 지역 성장률
    const monthlyRegionData = new Map<string, Map<string, number>>()
    data.forEach(p => {
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
      .filter(item => item !== null)
      .sort((a, b) => (b?.growthRate || 0) - (a?.growthRate || 0))

    // 시장 점유율
    const totalVisits = data.length
    const marketShare = regionStatsArray.map(stat => ({
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
      newPatientByRegion: regionStatsArray.map(stat => ({
        region: stat.region,
        newPatients: stat.newPatients,
        returningPatients: stat.returningPatients,
      })),
      marketShare,
    }
  }, [data])

  return (
    <div className="space-y-6">
      {/* 지역별 요약 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주요 지역 수</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.regionStats.length}</div>
            <p className="text-xs text-muted-foreground">
              활성 지역 수
            </p>
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
              {analysis.growthByRegion.length > 0 ? analysis.growthByRegion[0].region : '-'}
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

      {/* 지역별 통계 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>지역별 상세 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">지역</th>
                  <th className="text-right p-2">총 방문</th>
                  <th className="text-right p-2">고유 환자</th>
                  <th className="text-right p-2">신규</th>
                  <th className="text-right p-2">재방문</th>
                  <th className="text-right p-2">재방문율</th>
                  <th className="text-right p-2">평균 방문</th>
                </tr>
              </thead>
              <tbody>
                {analysis.regionStats.slice(0, 10).map((stat) => (
                  <tr key={stat.region} className="border-b">
                    <td className="p-2 font-medium">{stat.region}</td>
                    <td className="p-2 text-right">{stat.totalVisits.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.uniquePatients.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.newPatients.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.returningPatients.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.retentionRate.toFixed(1)}%</td>
                    <td className="p-2 text-right">{stat.avgVisitsPerPatient.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 지역별 시장 점유율 */}
      <Card>
        <CardHeader>
          <CardTitle>지역별 시장 점유율</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.marketShare.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.marketShare.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="share" fill="#8884d8" name="시장 점유율 (%)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 지역별 성장률 */}
      <Card>
        <CardHeader>
          <CardTitle>지역별 성장률 Top 10</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.growthByRegion.slice(0, 10).map((item, index) => (
              <div key={item.region} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium flex-1">{item.region}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">
                    {item.prevMonthCount} → {item.lastMonthCount}
                  </span>
                  <span className={`text-sm font-bold w-20 text-right ${
                    item.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.growthRate >= 0 ? '+' : ''}{item.growthRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

