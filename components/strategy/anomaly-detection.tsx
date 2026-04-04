'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, Scatter,
} from 'recharts'
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import type { PatientData } from '@/stores/data-store'
import { calculateMean, calculateStdDev, calculateZScore } from '@/lib/utils/statistical-insights'

interface AnomalyDetectionProps {
  data: PatientData[]
}

interface AnomalyPoint {
  month: string
  visits: number
  zScore: number
  type: 'surge' | 'drop' | 'normal'
  smoothed: number
  upper2: number
  lower2: number
  upper3: number
  lower3: number
}

function movingAvg(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - Math.floor(window / 2))
    const end = Math.min(values.length, i + Math.ceil(window / 2))
    const slice = values.slice(start, end)
    return slice.reduce((s, v) => s + v, 0) / slice.length
  })
}

export function AnomalyDetection({ data }: AnomalyDetectionProps) {
  const { chartData, anomalies, diseaseSurges } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], anomalies: [], diseaseSurges: [] }
    }

    // 월별 방문 수 집계
    const monthMap = new Map<string, number>()
    data.forEach((p) => {
      const d = new Date(p.visit_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
    })

    const sortedMonths = Array.from(monthMap.keys()).sort()
    if (sortedMonths.length < 3) return { chartData: [], anomalies: [], diseaseSurges: [] }

    const counts = sortedMonths.map((m) => monthMap.get(m)!)
    const smoothed = movingAvg(counts, 3)
    const mean = calculateMean(counts)
    const std = calculateStdDev(counts)

    const chartData: AnomalyPoint[] = sortedMonths.map((m, i) => {
      const v = counts[i]
      const z = calculateZScore(v, mean, std)
      const [y, mo] = m.split('-')
      return {
        month: `${y}년 ${parseInt(mo)}월`,
        visits: v,
        zScore: Math.round(z * 100) / 100,
        type: z >= 2 ? 'surge' : z <= -2 ? 'drop' : 'normal',
        smoothed: Math.round(smoothed[i]),
        upper2: Math.round(mean + 2 * std),
        lower2: Math.max(0, Math.round(mean - 2 * std)),
        upper3: Math.round(mean + 3 * std),
        lower3: Math.max(0, Math.round(mean - 3 * std)),
      }
    })

    const anomalies = chartData.filter((d) => d.type !== 'normal')

    // 질병별 월 집계 → 급증 탐지
    const diseaseDM = new Map<string, Map<string, number>>()
    data.forEach((p) => {
      const d = new Date(p.visit_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!diseaseDM.has(p.disease_name)) diseaseDM.set(p.disease_name, new Map())
      const dm = diseaseDM.get(p.disease_name)!
      dm.set(key, (dm.get(key) ?? 0) + 1)
    })

    const diseaseSurges: { disease: string; month: string; visits: number; zScore: number }[] = []
    diseaseDM.forEach((dm, disease) => {
      const ms = Array.from(dm.keys()).sort()
      const vs = ms.map((m) => dm.get(m)!)
      const dm_mean = calculateMean(vs)
      const dm_std = calculateStdDev(vs)
      ms.forEach((m, i) => {
        const z = calculateZScore(vs[i], dm_mean, dm_std)
        if (Math.abs(z) >= 2 && vs[i] >= 5) {
          const [y, mo] = m.split('-')
          diseaseSurges.push({
            disease,
            month: `${y}년 ${parseInt(mo)}월`,
            visits: vs[i],
            zScore: Math.round(z * 100) / 100,
          })
        }
      })
    })

    diseaseSurges.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))

    return { chartData, anomalies, diseaseSurges: diseaseSurges.slice(0, 15) }
  }, [data])

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>시계열 이상 탐지</CardTitle></CardHeader>
        <CardContent><div className="text-center py-12 text-muted-foreground">데이터가 없습니다.</div></CardContent>
      </Card>
    )
  }

  const surges = anomalies.filter((a) => a.type === 'surge')
  const drops = anomalies.filter((a) => a.type === 'drop')

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{surges.length}</div>
                <div className="text-sm text-muted-foreground">급증 이상 (Z &gt; 2σ)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{drops.length}</div>
                <div className="text-sm text-muted-foreground">급감 이상 (Z &lt; -2σ)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-500">{diseaseSurges.length}</div>
                <div className="text-sm text-muted-foreground">질환별 이상 탐지</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이상 탐지 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            월별 방문 수 이상 탐지 (Z-Score 기반)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            점선은 ±2σ 경계선. 경계선 바깥의 막대는 통계적 이상 구간입니다.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" domain={[-4, 4]} />
              <Tooltip
                formatter={(v: number, name: string) => {
                  if (name === 'Z점수') return [`${v}σ`, 'Z-Score']
                  return [`${v.toLocaleString()}명`, name]
                }}
              />
              <Legend />
              <ReferenceLine yAxisId="left" y={chartData[0]?.upper2} stroke="#f97316" strokeDasharray="4 4" label={{ value: '+2σ', position: 'right', fontSize: 10 }} />
              <ReferenceLine yAxisId="left" y={chartData[0]?.lower2} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: '-2σ', position: 'right', fontSize: 10 }} />
              <Bar
                yAxisId="left"
                dataKey="visits"
                name="방문 수"
                fill="#93c5fd"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="smoothed"
                name="3개월 이동평균"
                stroke="#1d4ed8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="zScore"
                name="Z점수"
                stroke="#f97316"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="3 3"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 이상 구간 목록 */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">이상 구간 목록</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {a.type === 'surge'
                      ? <TrendingUp className="h-4 w-4 text-red-500" />
                      : <TrendingDown className="h-4 w-4 text-blue-500" />}
                    <span className="font-medium text-sm">{a.month}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span>{a.visits.toLocaleString()}명 방문</span>
                    <Badge
                      className={a.type === 'surge' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}
                    >
                      Z={a.zScore > 0 ? '+' : ''}{a.zScore}σ
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 질환별 이상 탐지 */}
      {diseaseSurges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">질환별 이상 탐지 (|Z| ≥ 2σ)</CardTitle>
            <p className="text-sm text-muted-foreground">특정 질환의 방문이 평소보다 통계적으로 크게 증가하거나 감소한 월입니다.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">질환</th>
                    <th className="text-center p-2">월</th>
                    <th className="text-center p-2">방문 수</th>
                    <th className="text-center p-2">Z-Score</th>
                    <th className="text-center p-2">유형</th>
                  </tr>
                </thead>
                <tbody>
                  {diseaseSurges.map((s, i) => (
                    <tr key={i} className="border-b hover:bg-muted/20">
                      <td className="p-2">{s.disease}</td>
                      <td className="p-2 text-center">{s.month}</td>
                      <td className="p-2 text-center">{s.visits.toLocaleString()}명</td>
                      <td className="p-2 text-center">
                        <span className={s.zScore >= 2 ? 'text-red-600 font-bold' : 'text-blue-600 font-bold'}>
                          {s.zScore > 0 ? '+' : ''}{s.zScore}σ
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <Badge className={s.zScore >= 2 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}>
                          {s.zScore >= 2 ? '급증' : '급감'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
