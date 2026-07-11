'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Link2 } from 'lucide-react'
import type { PatientData } from '@/stores/data-store'
import { groupVisitsByPatient } from '@/lib/utils/patient-identity'
import { hasSurgery } from '@/lib/utils/analysis-helpers'
import { cohensH } from '@/lib/utils/advanced-analysis'

interface AssociationAnalysisProps {
  data: PatientData[]
}

interface AssociationRule {
  disease: string
  surgery: string
  support: number      // 해당 조합 환자 / 전체 환자
  confidence: number   // 해당 질병 환자 중 수술받은 비율
  lift: number         // confidence / P(surgery) — 1보다 크면 연관성 있음
  count: number        // 해당 조합 환자 수
  /** 질병 내 수술 비율 vs 전체 수술 경험 환자 비율의 Cohen h */
  cohensH: number
}

function liftBadge(lift: number) {
  if (lift >= 3) return <Badge className="bg-emerald-600 text-white text-xs">강한 연관 ×{lift.toFixed(1)}</Badge>
  if (lift >= 1.5) return <Badge className="bg-blue-500 text-white text-xs">연관 ×{lift.toFixed(1)}</Badge>
  if (lift >= 1) return <Badge variant="outline" className="text-xs">약한 연관 ×{lift.toFixed(1)}</Badge>
  return <Badge variant="secondary" className="text-xs">비연관 ×{lift.toFixed(1)}</Badge>
}

export function AssociationAnalysis({ data }: AssociationAnalysisProps) {
  const { rules, topChart, summaryStats } = useMemo(() => {
    if (!data || data.length === 0) return { rules: [], topChart: [], summaryStats: null }

    // 환자별 (질병 집합, 수술 집합) 구성
    const visitsByPatient = groupVisitsByPatient(data)
    const totalPatients = visitsByPatient.size

    if (totalPatients === 0) return { rules: [], topChart: [], summaryStats: null }

    // 질병별 환자 수
    const diseasePatients = new Map<string, Set<string>>()
    // 수술별 환자 수
    const surgeryPatients = new Map<string, Set<string>>()
    // 질병+수술 조합 환자 수
    const combinationPatients = new Map<string, Set<string>>()

    visitsByPatient.forEach((visits, pid) => {
      const diseases = new Set(visits.map((v) => v.disease_name).filter(Boolean))
      const surgeries = new Set(
        visits
          .filter((v) => hasSurgery(v))
          .map(
            (v) =>
              v.surgery_name?.toString().trim() ||
              v.surgery_code?.toString().trim() ||
              ''
          )
          .filter(Boolean)
      )

      diseases.forEach((disease) => {
        const set = diseasePatients.get(disease) ?? new Set()
        set.add(pid)
        diseasePatients.set(disease, set)
      })

      surgeries.forEach((surgery) => {
        const set = surgeryPatients.get(surgery) ?? new Set()
        set.add(pid)
        surgeryPatients.set(surgery, set)
      })

      diseases.forEach((disease) => {
        surgeries.forEach((surgery) => {
          const key = `${disease}|||${surgery}`
          const set = combinationPatients.get(key) ?? new Set()
          set.add(pid)
          combinationPatients.set(key, set)
        })
      })
    })

    // 연관 규칙 계산
    const rules: AssociationRule[] = []

    combinationPatients.forEach((pSet, key) => {
      const [disease, surgery] = key.split('|||')
      const count = pSet.size

      const diseaseCount = diseasePatients.get(disease)?.size ?? 0
      const surgeryCount = surgeryPatients.get(surgery)?.size ?? 0

      if (diseaseCount === 0 || surgeryCount === 0) return

      const support = count / totalPatients
      const confidence = count / diseaseCount
      const pSurgery = surgeryCount / totalPatients
      const lift = pSurgery > 0 ? confidence / pSurgery : 0
      const h = cohensH(confidence, pSurgery)

      // 최소 지지도 5% 이상, 최소 3명 이상
      if (support >= 0.01 && count >= 3) {
        rules.push({ disease, surgery, support, confidence, lift, count, cohensH: Math.round(h * 1000) / 1000 })
      }
    })

    // Lift 내림차순 정렬
    rules.sort((a, b) => b.lift - a.lift)

    // 상위 10개 차트 데이터
    const topChart = rules.slice(0, 10).map((r) => ({
      label: `${r.disease.substring(0, 6)}→${r.surgery.substring(0, 6)}`,
      lift: Math.round(r.lift * 100) / 100,
      confidence: Math.round(r.confidence * 1000) / 10,
      full: `${r.disease} → ${r.surgery}`,
    }))

    const strongRules = rules.filter((r) => r.lift >= 1.5).length
    const avgLift = rules.length > 0
      ? Math.round((rules.reduce((s, r) => s + r.lift, 0) / rules.length) * 100) / 100
      : 0

    return {
      rules,
      topChart,
      summaryStats: { totalRules: rules.length, strongRules, avgLift, totalPatients },
    }
  }, [data])

  if (!summaryStats) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />질병-수술 연관 분석</CardTitle></CardHeader>
        <CardContent><div className="text-center py-12 text-muted-foreground">데이터가 없습니다.</div></CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 설명 + 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            질병-수술 연관 규칙 분석
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            특정 질병을 가진 환자가 특정 수술을 받을 확률을 정량화합니다.
            <strong> Lift &gt; 1</strong>이면 우연보다 높은 연관성, <strong>Lift ≥ 1.5</strong>이면 임상적으로 유의미합니다.
            <strong> Cohen h</strong>은 질병 내 수술 비율과 전체 수술 비율 간 효과 크기입니다.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="p-3 bg-muted/40 rounded-lg">
              <div className="text-2xl font-bold">{summaryStats.totalRules}</div>
              <div className="text-sm text-muted-foreground">총 연관 규칙</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-700">{summaryStats.strongRules}</div>
              <div className="text-sm text-muted-foreground">강한 연관 규칙 (Lift ≥ 1.5)</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{summaryStats.avgLift}</div>
              <div className="text-sm text-muted-foreground">평균 Lift</div>
            </div>
          </div>

          {/* Lift 차트 */}
          {topChart.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Top 10 연관 규칙 (Lift 기준)</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topChart} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 'dataMax + 0.5']} tickFormatter={(v) => `×${v}`} />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    formatter={(v: number, name: string) =>
                      name === 'lift' ? [`×${v}`, 'Lift'] : [`${v}%`, '신뢰도']
                    }
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ''}
                  />
                  <Bar dataKey="lift" radius={[0, 4, 4, 0]}>
                    {topChart.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.lift >= 3
                            ? '#10b981'
                            : entry.lift >= 1.5
                            ? '#3b82f6'
                            : entry.lift >= 1
                            ? '#94a3b8'
                            : '#e2e8f0'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세 규칙 테이블 */}
      <Card>
        <CardHeader><CardTitle className="text-base">연관 규칙 상세 (상위 30개)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">질병</th>
                  <th className="text-left p-2">수술</th>
                  <th className="text-center p-2">환자 수</th>
                  <th className="text-center p-2">
                    <span className="cursor-help" title="해당 조합 환자 / 전체 환자">지지도</span>
                  </th>
                  <th className="text-center p-2">
                    <span className="cursor-help" title="해당 질병 환자 중 수술받은 비율">신뢰도</span>
                  </th>
                  <th className="text-center p-2">
                    <span className="cursor-help" title="우연보다 연관성이 높은 배수 (>1이면 연관)">Lift</span>
                  </th>
                  <th className="text-center p-2">
                    <span className="cursor-help" title="질병 내 수술 비율 vs 전체 수술 비율">Cohen h</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.slice(0, 30).map((r, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="p-2 text-sm">{r.disease}</td>
                    <td className="p-2 text-sm">{r.surgery}</td>
                    <td className="p-2 text-center">{r.count.toLocaleString()}명</td>
                    <td className="p-2 text-center text-xs">{(r.support * 100).toFixed(1)}%</td>
                    <td className="p-2 text-center">
                      <span className={r.confidence >= 0.5 ? 'text-emerald-700 font-bold' : ''}>
                        {(r.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-center">{liftBadge(r.lift)}</td>
                    <td className="p-2 text-center text-xs">{r.cohensH}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
