'use client'

import { useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ComposedChart, Bar, Legend,
} from 'recharts'
import { FlaskConical, Download, MapPinned } from 'lucide-react'
import type { PatientData } from '@/stores/data-store'
import { groupVisitsByPatient } from '@/lib/utils/patient-identity'
import {
  classicalSTL,
  singleChangePoint,
  kaplanMeierEstimate,
  buildFirstReturnKmSeries,
  populationStabilityIndex,
  kMeans2D,
  diseaseTransitionCounts,
  monthFixedEffectsResiduals,
  hierarchicalConsistencyRatio,
  buildAnalysisSettingsSnapshot,
} from '@/lib/utils/advanced-analysis'
interface AdvancedStatisticsTabProps {
  data: PatientData[]
}

export function AdvancedStatisticsTab({ data }: AdvancedStatisticsTabProps) {
  const analysis = useMemo(() => {
    if (!data?.length) return null

    const maxDate = Math.max(...data.map((p) => new Date(p.visit_date).getTime()))
    const visitsByPatient = groupVisitsByPatient(data)

    const gapsFirst: (number | null)[] = []
    const censorFirst: (number | null)[] = []
    const kPoints: [number, number][] = []
    const today = Date.now()

    visitsByPatient.forEach((visits) => {
      const sorted = [...visits].sort(
        (a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
      )
      const last = sorted[sorted.length - 1]
      const recency = Math.round((today - new Date(last.visit_date).getTime()) / 86400000)
      kPoints.push([Math.log(1 + sorted.length), Math.min(recency, 3650)])

      if (sorted.length >= 2) {
        const d0 = new Date(sorted[0].visit_date).getTime()
        const d1 = new Date(sorted[1].visit_date).getTime()
        gapsFirst.push(Math.max(1, Math.round((d1 - d0) / 86400000)))
        censorFirst.push(null)
      } else {
        gapsFirst.push(null)
        const d0 = new Date(sorted[0].visit_date).getTime()
        censorFirst.push(Math.max(1, Math.round((maxDate - d0) / 86400000)))
      }
    })

    const { times: kmTimes, eventOccurred: kmEv } = buildFirstReturnKmSeries(gapsFirst, censorFirst)
    const kmCurve = kaplanMeierEstimate(kmTimes, kmEv)

    const monthMap = new Map<string, number>()
    const monthKeys: string[] = []
    data.forEach((p) => {
      const d = new Date(p.visit_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
    })
    const sortedMonths = Array.from(monthMap.keys()).sort()
    const counts = sortedMonths.map((m) => monthMap.get(m)!)
    const calMonths = sortedMonths.map((m) => parseInt(m.split('-')[1], 10))
    const stl =
      counts.length >= 6
        ? classicalSTL(counts, calMonths, Math.min(12, Math.max(3, Math.floor(counts.length / 4) * 2 + 1)))
        : null
    const stlChart =
      stl && counts.length > 0
        ? sortedMonths.map((m, i) => {
            const [y, mo] = m.split('-')
            return {
              month: `${y}/${mo}`,
              원시: counts[i],
              추세: Math.round(stl.trend[i] * 10) / 10,
              계절: Math.round(stl.seasonal[i] * 10) / 10,
              잔차: Math.round(stl.residual[i] * 10) / 10,
            }
          })
        : []

    const cp = counts.length >= 6 ? singleChangePoint(counts) : null

    const km2 = kMeans2D(kPoints, Math.min(4, Math.max(2, Math.round(Math.sqrt(kPoints.length / 2)))))
    const scatterKm = kPoints.map((pt, i) => ({
      x: Math.round(pt[0] * 100) / 100,
      y: pt[1],
      cluster: km2.labels[i] ?? 0,
    }))

    const sequences: string[][] = []
    visitsByPatient.forEach((visits) => {
      const sorted = [...visits].sort(
        (a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
      )
      sequences.push(sorted.map((v) => v.disease_name).filter(Boolean))
    })
    const trans = diseaseTransitionCounts(sequences)
    const topTrans = Array.from(trans.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([path, cnt]) => ({ path, cnt }))

    const visitTimes = data.map((p) => new Date(p.visit_date).getTime()).sort((a, b) => a - b)
    const mid = visitTimes[Math.floor(visitTimes.length / 2)]
    const diseaseEarly = new Map<string, number>()
    const diseaseLate = new Map<string, number>()
    data.forEach((p) => {
      const t = new Date(p.visit_date).getTime()
      const m = t <= mid ? diseaseEarly : diseaseLate
      const d = p.disease_name || '(미기입)'
      m.set(d, (m.get(d) ?? 0) + 1)
    })
    const allDiseases = new Set([...diseaseEarly.keys(), ...diseaseLate.keys()])
    const disList = Array.from(allDiseases).slice(0, 40)
    const exp = disList.map((d) => diseaseEarly.get(d) ?? 0)
    const act = disList.map((d) => diseaseLate.get(d) ?? 0)
    const psi = populationStabilityIndex(exp, act)

    let missingDisease = 0
    let missingRegion = 0
    data.forEach((p) => {
      if (!p.disease_name?.trim()) missingDisease++
      if (!p.region?.trim()) missingRegion++
    })

    const fe = monthFixedEffectsResiduals(sortedMonths, counts)
    const feChart = sortedMonths.map((m, i) => {
      const [y, mo] = m.split('-')
      return {
        month: `${y}/${mo}`,
        잔차: Math.round(fe.residual[i] * 10) / 10,
        적합: Math.round(fe.fitted[i] * 10) / 10,
      }
    })

    const diseaseMonthly = new Map<string, number[]>()
    for (let i = 0; i < sortedMonths.length; i++) {
      const mk = sortedMonths[i]
      data.forEach((p) => {
        const d = new Date(p.visit_date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (key !== mk) return
        const dn = p.disease_name || '(기타)'
        if (!diseaseMonthly.has(dn)) {
          diseaseMonthly.set(dn, new Array(sortedMonths.length).fill(0))
        }
        const arr = diseaseMonthly.get(dn)!
        arr[i] += 1
      })
    }
    const hier = hierarchicalConsistencyRatio(diseaseMonthly, counts, 5)

    const discreteHazard: { 구간일: string; 위험도: number; 표본: number }[] = []
    const positiveGaps = gapsFirst.filter((g): g is number => typeof g === 'number' && g > 0)
    const bins = [0, 30, 60, 90, 180, 365, 99999]
    for (let b = 0; b < bins.length - 1; b++) {
      const lo = bins[b]
      const hi = bins[b + 1]
      const inBin = positiveGaps.filter((g) => g > lo && g <= hi).length
      const atRisk = positiveGaps.filter((g) => g > lo).length
      discreteHazard.push({
        구간일: `${lo}~${hi === 99999 ? '∞' : hi}일`,
        위험도: atRisk > 0 ? Math.round((inBin / atRisk) * 1000) / 1000 : 0,
        표본: atRisk,
      })
    }

    return {
      kmCurve,
      stlChart,
      cp,
      scatterKm,
      topTrans,
      psi,
      missingDisease,
      missingRegion,
      feChart,
      hier,
      discreteHazard,
      nPatients: visitsByPatient.size,
      snapshot: buildAnalysisSettingsSnapshot({
        wilsonConfidence: 0.95,
        fdrQ: 0.15,
        zAnomalyThreshold: 2,
        stlTrendWindow: 12,
        kmMaxDays: 3650,
      }),
    }
  }, [data])

  const downloadSnapshot = useCallback(() => {
    if (!analysis) return
    const blob = new Blob([JSON.stringify(analysis.snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-settings-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [analysis])

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            고급 통계·시계열
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">데이터가 없습니다.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">관찰 데이터 및 해석 한계</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            본 탭의 생존분석·FDR·STL·PSI 등은 <strong>업로드된 방문 기록</strong>에 기반한 통계적 요약이며,
            무작위 대조시험이나 인과 추론을 대체하지 않습니다. 임상·재무적 결론은 반드시 별도 검증이 필요합니다.
          </p>
          <p className="flex items-start gap-2">
            <MapPinned className="h-4 w-4 shrink-0 mt-0.5" />
            공간 자기상관(Moran&apos;s I 등)은 지역 좌표 품질·격자 단위 정의가 갖춰진 뒤 확장하는 것이 적절합니다.
          </p>
          <Button variant="outline" size="sm" onClick={downloadSnapshot} className="gap-2">
            <Download className="h-4 w-4" />
            분석 파라미터 스냅샷 JSON 내려받기
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">첫 재방문까지 — Kaplan–Meier (일 단위)</CardTitle>
            <p className="text-sm text-muted-foreground">
              2회 이상 방문: 첫·둘째 방문 간격을 이벤트로 처리. 1회만 방문: 관찰 말일까지 꼬임.
            </p>
          </CardHeader>
          <CardContent>
            {analysis.kmCurve.length === 0 ? (
              <p className="text-sm text-muted-foreground">추정 가능한 사건이 없습니다.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={analysis.kmCurve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} label={{ value: '일', position: 'insideBottom', offset: -4 }} />
                  <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <Tooltip formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, '생존']} />
                  <Line type="stepAfter" dataKey="survival" stroke="#2563eb" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">변화점 탐지 (월별 방문 — 단일 분할)</CardTitle>
          </CardHeader>
          <CardContent>
            {!analysis.cp ? (
              <p className="text-sm text-muted-foreground">월 수가 부족하거나 변화가 뚜렷하지 않습니다.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <p>
                  분할 시점 인덱스: <Badge variant="secondary">{analysis.cp.index}</Badge> (이전 평균{' '}
                  {analysis.cp.beforeMean.toFixed(1)} → 이후 {analysis.cp.afterMean.toFixed(1)})
                </p>
                <p className="text-muted-foreground">
                  SSE 감소량: {analysis.cp.reductionSSE.toFixed(0)} — 운영·입력 방식 변경 여부와 함께 검토하세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analysis.stlChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">가법 STL 분해 (추세 / 계절 / 잔차)</CardTitle>
            <p className="text-sm text-muted-foreground">전통적 가법 분해 근사. 월별 달력 효과를 계절 성분으로 흡수합니다.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analysis.stlChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={55} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="원시" fill="#cbd5e1" name="원시 방문" />
                <Line type="monotone" dataKey="추세" stroke="#1d4ed8" dot={false} name="추세" />
                <Line type="monotone" dataKey="계절" stroke="#16a34a" dot={false} name="계절" />
                <Line type="monotone" dataKey="잔차" stroke="#ea580c" dot={false} name="잔차" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">환자 클러스터 (log(1+방문), 최근성 일수)</CardTitle>
            <p className="text-sm text-muted-foreground">k-means 간이 분류. 해석은 탐색적입니다.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="log(1+F)" tick={{ fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="최근성" tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number, n: string) => [v, n]} />
                <Scatter data={analysis.scatterKm} fill="#6366f1" />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              색 구분은 클러스터 ID입니다. Recharts Scatter는 색 분리 한계가 있어 테이블로 보조합니다.
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {[0, 1, 2, 3].map((c) => (
                <Badge key={c} variant="outline" className="text-xs">
                  군 {c}: {analysis.scatterKm.filter((s) => s.cluster === c).length}명
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">질병 순서 전이 (상위 경로)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[280px] overflow-y-auto space-y-1 text-sm">
              {analysis.topTrans.length === 0 ? (
                <span className="text-muted-foreground">연속 방문이 부족합니다.</span>
              ) : (
                analysis.topTrans.map((row) => (
                  <div key={row.path} className="flex justify-between border-b py-1">
                    <span className="pr-2">{row.path}</span>
                    <Badge variant="secondary">{row.cnt}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">질병 믹스 PSI (전반기 vs 후반기)</CardTitle>
            <p className="text-sm text-muted-foreground">상위 40개 질병 버킷 기준. 0.1~0.25는 일반적 모니터링, 0.25+는 분포 변동 의심.</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-700">{analysis.psi.toFixed(3)}</div>
            <p className="text-sm text-muted-foreground mt-2">방문 시점 중앙값 기준 전·후 절반 비교.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">결측·민감도 메모</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              질병명 공란: <strong>{analysis.missingDisease}</strong>건 / 지역 공란:{' '}
              <strong>{analysis.missingRegion}</strong>건 (총 {data.length}행)
            </p>
            <p className="text-muted-foreground">
              결측이 많으면 세그먼트·연관 규칙이 왜곡될 수 있습니다. 업로드 전 정제를 권장합니다.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">월 고정효과 제거 후 잔차 (전체 방문)</CardTitle>
          <p className="text-sm text-muted-foreground">같은 달력 월의 평균 편차를 제거한 뒤 남는 변동입니다.</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={analysis.feChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="적합" fill="#bae6fd" name="월별 기대(적합)" />
              <Line type="monotone" dataKey="잔차" stroke="#b91c1c" dot name="잔차" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">계층 일관성 (상위 5개 질병 월합 / 전체)</CardTitle>
            <p className="text-sm text-muted-foreground">상위 질병들의 월별 합이 전체 월 방문에 차지하는 비율입니다.</p>
          </CardHeader>
          <CardContent>
            {analysis.hier == null ? (
              <span className="text-muted-foreground">계산 불가</span>
            ) : (
              <div className="text-3xl font-bold text-teal-700">{(analysis.hier * 100).toFixed(1)}%</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">첫 재방문 간격 — 이산 위험(구간별)</CardTitle>
            <p className="text-sm text-muted-foreground">이전 구간을 넘긴 사례 중 다음 구간 안에 도달한 비율(단순 위험).</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">구간</th>
                    <th className="text-center p-2">조건부 위험</th>
                    <th className="text-center p-2">위험집단 n</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.discreteHazard.map((row) => (
                    <tr key={row.구간일} className="border-b">
                      <td className="p-2">{row.구간일}</td>
                      <td className="p-2 text-center">{row.위험도}</td>
                      <td className="p-2 text-center">{row.표본}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
