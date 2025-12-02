'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { Calendar, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface TrendAnalysisProps {
  data: PatientData[]
}

export function TrendAnalysis({ data }: TrendAnalysisProps) {
  const analysis = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        monthlyTrend: [],
        quarterlyTrend: [],
        seasonalTrend: [],
        dayOfWeekTrend: [],
      }
    }

    // 월별 트렌드
    const monthlyData = new Map<string, { visits: number; unique: Set<string> }>()
    data.forEach(p => {
      const month = p.visit_date.substring(0, 7) // YYYY-MM
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { visits: 0, unique: new Set() })
      }
      const monthStat = monthlyData.get(month)!
      monthStat.visits++
      monthStat.unique.add(p.patient_id)
    })

    const monthlyTrend = Array.from(monthlyData.entries())
      .map(([month, stat]) => ({
        month,
        visits: stat.visits,
        uniquePatients: stat.unique.size,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // 분기별 트렌드
    const quarterlyData = new Map<string, { visits: number; unique: Set<string> }>()
    data.forEach(p => {
      const date = new Date(p.visit_date)
      const year = date.getFullYear()
      const quarter = Math.floor(date.getMonth() / 3) + 1
      const quarterKey = `${year}-Q${quarter}`
      
      if (!quarterlyData.has(quarterKey)) {
        quarterlyData.set(quarterKey, { visits: 0, unique: new Set() })
      }
      const quarterStat = quarterlyData.get(quarterKey)!
      quarterStat.visits++
      quarterStat.unique.add(p.patient_id)
    })

    const quarterlyTrend = Array.from(quarterlyData.entries())
      .map(([quarter, stat]) => ({
        quarter,
        visits: stat.visits,
        uniquePatients: stat.unique.size,
      }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter))

    // 계절별 트렌드
    const seasonalData = new Map<string, { visits: number; unique: Set<string> }>()
    data.forEach(p => {
      const date = new Date(p.visit_date)
      const month = date.getMonth() + 1
      let season = ''
      if (month >= 3 && month <= 5) season = '봄'
      else if (month >= 6 && month <= 8) season = '여름'
      else if (month >= 9 && month <= 11) season = '가을'
      else season = '겨울'
      
      if (!seasonalData.has(season)) {
        seasonalData.set(season, { visits: 0, unique: new Set() })
      }
      const seasonStat = seasonalData.get(season)!
      seasonStat.visits++
      seasonStat.unique.add(p.patient_id)
    })

    const seasonalTrend = Array.from(seasonalData.entries())
      .map(([season, stat]) => ({
        season,
        visits: stat.visits,
        uniquePatients: stat.unique.size,
      }))
      .sort((a, b) => {
        const order = ['봄', '여름', '가을', '겨울']
        return order.indexOf(a.season) - order.indexOf(b.season)
      })

    // 요일별 트렌드
    const dayOfWeekData = new Map<string, number>()
    data.forEach(p => {
      const date = new Date(p.visit_date)
      const day = date.getDay()
      const dayNames = ['일', '월', '화', '수', '목', '금', '토']
      const dayName = dayNames[day]
      
      dayOfWeekData.set(dayName, (dayOfWeekData.get(dayName) || 0) + 1)
    })

    const dayOfWeekTrend = Array.from(dayOfWeekData.entries())
      .map(([day, visits]) => ({ day, visits }))
      .sort((a, b) => {
        const order = ['일', '월', '화', '수', '목', '금', '토']
        return order.indexOf(a.day) - order.indexOf(b.day)
      })

    return {
      monthlyTrend,
      quarterlyTrend,
      seasonalTrend,
      dayOfWeekTrend,
    }
  }, [data])

  return (
    <div className="space-y-6">
      {/* 월별 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 환자 방문 트렌드</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analysis.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visits" stroke="#8884d8" name="방문 수" />
              <Line type="monotone" dataKey="uniquePatients" stroke="#82ca9d" name="고유 환자 수" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 분기별 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle>분기별 환자 방문 트렌드</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysis.quarterlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visits" fill="#8884d8" name="방문 수" />
              <Bar dataKey="uniquePatients" fill="#82ca9d" name="고유 환자 수" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 계절별 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle>계절별 환자 방문 패턴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.seasonalTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="visits" fill="#8884d8" name="방문 수" />
                <Bar dataKey="uniquePatients" fill="#82ca9d" name="고유 환자 수" />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {analysis.seasonalTrend.map((season) => (
                <div key={season.season} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{season.season}</p>
                    <p className="text-xs text-muted-foreground">
                      {season.uniquePatients}명 고유 환자
                    </p>
                  </div>
                  <span className="text-lg font-bold">{season.visits}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 요일별 트렌드 */}
      <Card>
        <CardHeader>
          <CardTitle>요일별 환자 방문 패턴</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysis.dayOfWeekTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visits" fill="#8884d8" name="방문 수" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

