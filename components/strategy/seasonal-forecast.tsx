'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, ReferenceLine,
} from 'recharts'
import { TrendingUp, Sun } from 'lucide-react'
import type { PatientData } from '@/stores/data-store'
import { calculateMean, calculateStdDev, calculateMovingAverage } from '@/lib/utils/statistical-insights'

interface SeasonalForecastProps {
  data: PatientData[]
}

const SEASON_MONTHS: Record<number, string> = {
  3: '봄', 4: '봄', 5: '봄',
  6: '여름', 7: '여름', 8: '여름',
  9: '가을', 10: '가을', 11: '가을',
  12: '겨울', 1: '겨울', 2: '겨울',
}

/** 지수 평활 예측 */
function exponentialSmoothing(values: number[], alpha = 0.3): number[] {
  if (values.length === 0) return []
  const result: number[] = [values[0]]
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1])
  }
  return result
}

/** 다음 N개 예측 (마지막 평활값 + 트렌드) */
function forecastNext(smoothed: number[], n = 3): number[] {
  if (smoothed.length < 2) return Array(n).fill(smoothed[0] ?? 0)
  const last = smoothed[smoothed.length - 1]
  const trend = (smoothed[smoothed.length - 1] - smoothed[0]) / Math.max(smoothed.length - 1, 1)
  return Array.from({ length: n }, (_, i) => Math.max(0, last + trend * (i + 1)))
}

export function SeasonalForecast({ data }: SeasonalForecastProps) {
  const { monthlyVisits, seasonalIndex, forecastData, topSeasonalDiseases } = useMemo(() => {
    if (!data || data.length === 0) {
      return { monthlyVisits: [], seasonalIndex: [], forecastData: [], topSeasonalDiseases: [] }
    }

    // 월별 방문 수 집계 (YYYY-MM)
    const monthMap = new Map<string, number>()
    data.forEach((p) => {
      const d = new Date(p.visit_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
    })

    const sortedMonths = Array.from(monthMap.keys()).sort()
    const counts = sortedMonths.map((m) => monthMap.get(m)!)

    // 지수 평활
    const smoothed = exponentialSmoothing(counts, 0.3)
    const stdDev = calculateStdDev(counts)
    const meanVal = calculateMean(counts)

    // 과거 데이터 + 예측값
    const forecastValues = forecastNext(smoothed, 3)
    const allMonthData = sortedMonths.map((m, i) => {
      const [y, mo] = m.split('-').map(Number)
      const label = `${y}년 ${mo}월`
      const v = counts[i]
      const upper = smoothed[i] + 1.96 * stdDev
      const lower = Math.max(0, smoothed[i] - 1.96 * stdDev)
      return {
        month: label,
        실제방문수: v,
        평활: Math.round(smoothed[i]),
        상한: Math.round(upper),
        하한: Math.round(lower),
        isForecast: false,
      }
    })

    // 예측 3개월 추가
    for (let i = 0; i < forecastValues.length; i++) {
      const lastDate = new Date(sortedMonths[sortedMonths.length - 1] + '-01')
      lastDate.setMonth(lastDate.getMonth() + i + 1)
      const label = `${lastDate.getFullYear()}년 ${lastDate.getMonth() + 1}월 (예측)`
      const fv = forecastValues[i]
      allMonthData.push({
        month: label,
        실제방문수: 0,
        평활: Math.round(fv),
        상한: Math.round(fv + 1.96 * stdDev),
        하한: Math.max(0, Math.round(fv - 1.96 * stdDev)),
        isForecast: true,
      })
    }

    // 계절성 지수 계산: 월 번호(1~12)별 평균 방문 수 / 전체 평균
    const monthBucket: Record<number, number[]> = {}
    sortedMonths.forEach((m, i) => {
      const mo = parseInt(m.split('-')[1])
      if (!monthBucket[mo]) monthBucket[mo] = []
      monthBucket[mo].push(counts[i])
    })

    const seasonalIndex = Array.from({ length: 12 }, (_, i) => {
      const mo = i + 1
      const vals = monthBucket[mo] ?? []
      const avg = vals.length > 0 ? calculateMean(vals) : 0
      const index = meanVal > 0 ? Math.round((avg / meanVal) * 100) : 100
      return {
        month: `${mo}월`,
        계절지수: index,
        season: SEASON_MONTHS[mo],
        isPeak: index >= 120,
        isLow: index <= 80,
      }
    })

    // 질병별 계절 집중도 (특정 계절에 집중된 질병 상위 5개)
    const diseaseSeason: Record<string, Record<string, number>> = {}
    data.forEach((p) => {
      const d = new Date(p.visit_date)
      const season = SEASON_MONTHS[d.getMonth() + 1] ?? '기타'
      if (!diseaseSeason[p.disease_name]) diseaseSeason[p.disease_name] = {}
      diseaseSeason[p.disease_name][season] = (diseaseSeason[p.disease_name][season] ?? 0) + 1
    })

    const topSeasonalDiseases = Object.entries(diseaseSeason)
      .map(([disease, seasonCounts]) => {
        const total = Object.values(seasonCounts).reduce((s, v) => s + v, 0)
        const peak = Object.entries(seasonCounts).sort((a, b) => b[1] - a[1])[0]
        return {
          disease,
          total,
          peakSeason: peak?.[0] ?? '-',
          peakCount: peak?.[1] ?? 0,
          concentration: total > 0 ? Math.round((peak[1] / total) * 100) : 0,
        }
      })
      .filter((d) => d.concentration >= 40 && d.total >= 5)
      .sort((a, b) => b.concentration - a.concentration)
      .slice(0, 8)

    return {
      monthlyVisits: allMonthData,
      seasonalIndex,
      forecastData: allMonthData,
      topSeasonalDiseases,
    }
  }, [data])

  if (!monthlyVisits || monthlyVisits.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>계절성 분석 및 예측</CardTitle></CardHeader>
        <CardContent><div className="text-center py-12 text-muted-foreground">데이터가 없습니다.</div></CardContent>
      </Card>
    )
  }

  const peakMonths = seasonalIndex.filter((s) => s.isPeak)
  const lowMonths = seasonalIndex.filter((s) => s.isLow)

  return (
    <div className="space-y-4">
      {/* 방문 수 예측 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            월별 방문 수 추이 및 예측 (95% 신뢰구간)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            지수 평활법 기반 예측. 음영 영역은 95% 신뢰구간입니다.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area dataKey="상한" fill="#dbeafe" stroke="transparent" stackId="ci" />
              <Area dataKey="하한" fill="#ffffff" stroke="transparent" stackId="ci" />
              <Bar dataKey="실제방문수" fill="#93c5fd" name="실제 방문 수" />
              <Line dataKey="평활" stroke="#2563eb" strokeWidth={2} dot={false} name="평활값/예측" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 계절성 지수 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            월별 계절성 지수
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            100 기준 — 100 초과 시 성수기(방문 증가), 100 미만 시 비수기.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3 flex-wrap">
            {peakMonths.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">성수기:</span>
                {peakMonths.map((m) => (
                  <Badge key={m.month} className="bg-orange-500 text-white text-xs">
                    {m.month} ({m.계절지수})
                  </Badge>
                ))}
              </div>
            )}
            {lowMonths.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">비수기:</span>
                {lowMonths.map((m) => (
                  <Badge key={m.month} variant="secondary" className="text-xs">
                    {m.month} ({m.계절지수})
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={seasonalIndex}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[50, 150]} />
              <Tooltip formatter={(v: number) => [`${v}`, '계절지수']} />
              <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: '기준(100)', position: 'right', fontSize: 11 }} />
              <Bar dataKey="계절지수" radius={[4, 4, 0, 0]}>
                {seasonalIndex.map((entry, i) => (
                  <rect
                    key={i}
                    fill={entry.isPeak ? '#f97316' : entry.isLow ? '#93c5fd' : '#a3a3a3'}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 계절 집중 질병 */}
      {topSeasonalDiseases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">계절 집중 질환 Top 8</CardTitle>
            <p className="text-sm text-muted-foreground">특정 계절에 방문이 40% 이상 집중된 질환입니다.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topSeasonalDiseases.map((d) => (
                <div
                  key={d.disease}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div>
                    <span className="font-medium text-sm">{d.disease}</span>
                    <span className="ml-2 text-xs text-muted-foreground">총 {d.total.toLocaleString()}건</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {d.peakSeason} 집중
                    </Badge>
                    <span className="text-sm font-bold text-orange-600">{d.concentration}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
