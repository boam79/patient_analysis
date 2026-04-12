'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react'
import type { PatientData } from '@/stores/data-store'
import { groupVisitsByPatient, calcVisitIntervals } from '@/lib/utils/patient-identity'
import { calculatePercentile } from '@/lib/utils/statistical-insights'
import { wilsonScoreInterval } from '@/lib/utils/advanced-analysis'

interface RfmAnalysisProps {
  data: PatientData[]
}

type RiskLevel = 'high' | 'medium' | 'low' | 'new'

interface RfmScore {
  patientId: string
  displayName: string
  recency: number      // 마지막 방문 후 경과일
  frequency: number    // 총 방문 횟수
  rScore: number       // 1~5 (낮을수록 오래됨 → 위험)
  fScore: number       // 1~5 (높을수록 충성)
  risk: RiskLevel
  lastVisit: string
  diseases: string[]
}

function riskBadge(risk: RiskLevel) {
  switch (risk) {
    case 'high':
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />이탈 위험</Badge>
    case 'medium':
      return <Badge className="gap-1 bg-orange-500 hover:bg-orange-600"><AlertCircle className="h-3 w-3" />관심 필요</Badge>
    case 'low':
      return <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700"><ShieldCheck className="h-3 w-3" />충성 환자</Badge>
    case 'new':
      return <Badge variant="secondary" className="gap-1">신규</Badge>
  }
}

export function RfmAnalysis({ data }: RfmAnalysisProps) {
  const { scores, summary, riskDistribution } = useMemo(() => {
    if (!data || data.length === 0) {
      return { scores: [], summary: null, riskDistribution: [] }
    }

    const today = Date.now()
    const MS_PER_DAY = 1000 * 60 * 60 * 24

    const visitsByPatient = groupVisitsByPatient(data)

    // 각 환자별 R, F 값 계산
    const rawScores = Array.from(visitsByPatient.entries()).map(([pid, visits]) => {
      const lastVisit = visits[visits.length - 1]
      const recency = Math.round(
        (today - new Date(lastVisit.visit_date).getTime()) / MS_PER_DAY
      )
      const frequency = visits.length
      const diseases = Array.from(new Set(visits.map((v) => v.disease_name)))
      return { pid, recency, frequency, lastVisit: lastVisit.visit_date, diseases, name: lastVisit.name }
    })

    // 분위 기반 점수화 (1~5)
    const recencies = rawScores.map((s) => s.recency)
    const frequencies = rawScores.map((s) => s.frequency)

    // Recency: 낮을수록(최근 방문) 좋음 → 높은 점수
    const rP20 = calculatePercentile(recencies, 20)
    const rP40 = calculatePercentile(recencies, 40)
    const rP60 = calculatePercentile(recencies, 60)
    const rP80 = calculatePercentile(recencies, 80)

    // Frequency: 높을수록 좋음 → 높은 점수
    const fP20 = calculatePercentile(frequencies, 20)
    const fP40 = calculatePercentile(frequencies, 40)
    const fP60 = calculatePercentile(frequencies, 60)
    const fP80 = calculatePercentile(frequencies, 80)

    function rScore(r: number): number {
      if (r <= rP20) return 5
      if (r <= rP40) return 4
      if (r <= rP60) return 3
      if (r <= rP80) return 2
      return 1
    }

    function fScore(f: number): number {
      if (f >= fP80) return 5
      if (f >= fP60) return 4
      if (f >= fP40) return 3
      if (f >= fP20) return 2
      return 1
    }

    function determineRisk(rs: number, fs: number, frequency: number): RiskLevel {
      if (frequency === 1) return 'new'
      if (rs <= 2 && fs >= 3) return 'high'  // 예전엔 자주 왔는데 요즘 안 옴
      if (rs <= 2) return 'high'              // 오래됐고 자주도 안 옴
      if (rs >= 4 && fs >= 4) return 'low'   // 최근에도 자주 옴 → 충성
      return 'medium'
    }

    const scores: RfmScore[] = rawScores.map((s) => {
      const rs = rScore(s.recency)
      const fs = fScore(s.frequency)
      return {
        patientId: s.pid,
        displayName: s.name.length > 2 ? `${s.name[0]}${'*'.repeat(s.name.length - 2)}${s.name[s.name.length - 1]}` : s.name,
        recency: s.recency,
        frequency: s.frequency,
        rScore: rs,
        fScore: fs,
        risk: determineRisk(rs, fs, s.frequency),
        lastVisit: s.lastVisit,
        diseases: s.diseases,
      }
    })

    const highRisk = scores.filter((s) => s.risk === 'high').length
    const medium = scores.filter((s) => s.risk === 'medium').length
    const low = scores.filter((s) => s.risk === 'low').length
    const newP = scores.filter((s) => s.risk === 'new').length

    const riskDistribution = [
      { name: '이탈 위험', count: highRisk, fill: '#ef4444' },
      { name: '관심 필요', count: medium, fill: '#f97316' },
      { name: '충성 환자', count: low, fill: '#10b981' },
      { name: '신규 환자', count: newP, fill: '#6b7280' },
    ]

    return {
      scores: scores.sort((a, b) => a.rScore - b.rScore || b.fScore - a.fScore),
      summary: { highRisk, medium, low, newP, total: scores.length },
      riskDistribution,
    }
  }, [data])

  if (!summary) {
    return (
      <Card>
        <CardHeader><CardTitle>RFM 이탈 위험도 분석</CardTitle></CardHeader>
        <CardContent><div className="text-center py-12 text-muted-foreground">데이터가 없습니다.</div></CardContent>
      </Card>
    )
  }

  const pctFmt = (k: number, n: number) => {
    if (n <= 0) return '—'
    const w = wilsonScoreInterval(k, n, 0.95)
    const p = Math.round((k / n) * 1000) / 10
    return `${p}% (Wilson 95%: ${(w.low * 100).toFixed(1)}~${(w.high * 100).toFixed(1)}%)`
  }

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{summary.highRisk.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">이탈 위험 환자</div>
            <div className="text-xs text-muted-foreground mt-1">
              {pctFmt(summary.highRisk, summary.total)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-500">{summary.medium.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">관심 필요 환자</div>
            <div className="text-xs text-muted-foreground mt-1">
              {pctFmt(summary.medium, summary.total)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">{summary.low.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">충성 환자</div>
            <div className="text-xs text-muted-foreground mt-1">
              {pctFmt(summary.low, summary.total)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-500">{summary.newP.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">신규 환자 (1회)</div>
            <div className="text-xs text-muted-foreground mt-1">
              {pctFmt(summary.newP, summary.total)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 분포 차트 */}
        <Card>
          <CardHeader><CardTitle className="text-base">위험도 분포</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString()}명`]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RFM 행동 가이드 */}
        <Card>
          <CardHeader><CardTitle className="text-base">세그먼트별 권고 액션</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                risk: 'high' as RiskLevel,
                action: '긴급 리콜 문자 + 건강 검진 안내 발송. 마지막 방문 질환 관련 추적 관리 필요.',
              },
              {
                risk: 'medium' as RiskLevel,
                action: '정기 건강 뉴스레터 발송. 계절별 관련 질환 예방 안내로 관계 유지.',
              },
              {
                risk: 'low' as RiskLevel,
                action: '충성 환자 프로그램(VIP 건강 검진, 우선 예약) 제공. 가족 환자 유입 연계.',
              },
              {
                risk: 'new' as RiskLevel,
                action: '초진 후 30일 이내 추적 연락. 치료 결과 확인 및 재방문 유도.',
              },
            ].map(({ risk, action }) => (
              <div key={risk} className="flex gap-3 items-start p-2 rounded-lg bg-muted/40">
                <div className="shrink-0 mt-0.5">{riskBadge(risk)}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 이탈 위험 환자 목록 (상위 20명) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            이탈 위험 환자 목록 (R점수 낮음 기준 상위 20명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">환자</th>
                  <th className="text-center p-2">마지막 방문</th>
                  <th className="text-center p-2">경과일</th>
                  <th className="text-center p-2">총 방문</th>
                  <th className="text-center p-2">R점수</th>
                  <th className="text-center p-2">F점수</th>
                  <th className="text-left p-2">주요 질환</th>
                  <th className="text-center p-2">위험도</th>
                </tr>
              </thead>
              <tbody>
                {scores
                  .filter((s) => s.risk === 'high' || s.risk === 'medium')
                  .slice(0, 20)
                  .map((s) => (
                    <tr key={s.patientId} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-mono text-xs">{s.displayName}</td>
                      <td className="p-2 text-center text-xs">{s.lastVisit}</td>
                      <td className="p-2 text-center">
                        <span className={s.recency > 180 ? 'text-red-600 font-bold' : s.recency > 90 ? 'text-orange-500 font-bold' : ''}>
                          {s.recency}일
                        </span>
                      </td>
                      <td className="p-2 text-center">{s.frequency}회</td>
                      <td className="p-2 text-center">
                        <span className={`font-bold ${s.rScore <= 2 ? 'text-red-500' : 'text-gray-700'}`}>
                          {s.rScore}/5
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`font-bold ${s.fScore >= 4 ? 'text-emerald-600' : 'text-gray-700'}`}>
                          {s.fScore}/5
                        </span>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {s.diseases.slice(0, 2).join(', ')}
                        {s.diseases.length > 2 && ` 외 ${s.diseases.length - 2}개`}
                      </td>
                      <td className="p-2 text-center">{riskBadge(s.risk)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {scores.filter((s) => s.risk === 'high' || s.risk === 'medium').length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                이탈 위험 환자가 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
