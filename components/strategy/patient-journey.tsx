'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitMerge } from 'lucide-react'
import type { PatientData } from '@/stores/data-store'
import { groupVisitsByPatient } from '@/lib/utils/patient-identity'

interface PatientJourneyProps {
  data: PatientData[]
}

interface FlowNode {
  id: string
  label: string
  value: number
  color: string
  x: number
  y: number
  height: number
}

interface FlowLink {
  source: string
  target: string
  value: number
  color: string
}

const COLORS = {
  진단: '#3b82f6',
  수술있음: '#8b5cf6',
  수술없음: '#64748b',
  재방문: '#10b981',
  이탈위험: '#f97316',
  충성: '#059669',
  신규: '#94a3b8',
}

/** 단순 SVG 기반 Sankey 레이아웃 */
function buildSankeyLayout(
  nodes: { id: string; label: string; value: number; color: string }[],
  links: { source: string; target: string; value: number }[],
  width: number,
  height: number
) {
  // 열(column)별 노드 그룹화
  const columns: string[][] = []
  // 층 1: 질환 그룹 (진단)
  const layer1 = nodes.filter((n) => n.id.startsWith('disease_'))
  // 층 2: 수술 여부
  const layer2 = nodes.filter((n) => n.id.startsWith('surgery_'))
  // 층 3: 보유 상태
  const layer3 = nodes.filter((n) => n.id.startsWith('status_'))

  columns.push(layer1.map((n) => n.id))
  columns.push(layer2.map((n) => n.id))
  columns.push(layer3.map((n) => n.id))

  const PAD = 10
  const colWidth = (width - PAD * 2) / columns.length
  const nodeWidth = 16
  const nodeMap = new Map<string, FlowNode>()

  columns.forEach((col, ci) => {
    const totalVal = col.reduce((s, id) => {
      const n = nodes.find((n) => n.id === id)
      return s + (n?.value ?? 0)
    }, 0)
    const availH = height - PAD * 2
    let curY = PAD

    col.forEach((id) => {
      const n = nodes.find((n) => n.id === id)!
      const h = Math.max(20, (n.value / Math.max(totalVal, 1)) * availH)
      nodeMap.set(id, {
        ...n,
        x: PAD + ci * colWidth,
        y: curY,
        height: h,
      })
      curY += h + 6
    })
  })

  return { nodeMap, nodeWidth, colWidth }
}

export function PatientJourney({ data }: PatientJourneyProps) {
  const { flows, summary } = useMemo(() => {
    if (!data || data.length === 0) return { flows: null, summary: null }

    const visitsByPatient = groupVisitsByPatient(data)
    const totalPatients = visitsByPatient.size

    // 상위 5개 질병만 표시
    const diseaseCounts = new Map<string, number>()
    visitsByPatient.forEach((visits) => {
      const diseases = Array.from(new Set(visits.map((v) => v.disease_name)))
      diseases.forEach((d) => diseaseCounts.set(d, (diseaseCounts.get(d) ?? 0) + 1))
    })
    const top5Diseases = Array.from(diseaseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([d]) => d)

    // 각 환자별 분류
    type PatientFlow = {
      disease: string
      hasSurgery: boolean
      visitCount: number
    }

    const patientFlows: PatientFlow[] = []
    visitsByPatient.forEach((visits) => {
      const diseases = Array.from(new Set(visits.map((v) => v.disease_name)))
      const primaryDisease = diseases[0]
      if (!top5Diseases.includes(primaryDisease)) return
      const hasSurgery = visits.some((v) => v.surgery_name)
      patientFlows.push({
        disease: primaryDisease,
        hasSurgery,
        visitCount: visits.length,
      })
    })

    // 집계
    type Agg = { withSurgery: number; withoutSurgery: number }
    const diseaseAgg = new Map<string, Agg>()
    top5Diseases.forEach((d) => diseaseAgg.set(d, { withSurgery: 0, withoutSurgery: 0 }))

    patientFlows.forEach((pf) => {
      const agg = diseaseAgg.get(pf.disease)
      if (!agg) return
      if (pf.hasSurgery) agg.withSurgery++
      else agg.withoutSurgery++
    })

    // 수술 있음/없음별 보유 상태
    type StatusAgg = { loyal: number; atRisk: number; newPt: number }
    const surgeryStatus: Record<'surgery' | 'no_surgery', StatusAgg> = {
      surgery: { loyal: 0, atRisk: 0, newPt: 0 },
      no_surgery: { loyal: 0, atRisk: 0, newPt: 0 },
    }

    patientFlows.forEach((pf) => {
      const key = pf.hasSurgery ? 'surgery' : 'no_surgery'
      if (pf.visitCount === 1) surgeryStatus[key].newPt++
      else if (pf.visitCount >= 4) surgeryStatus[key].loyal++
      else surgeryStatus[key].atRisk++
    })

    const totalSurgery = patientFlows.filter((p) => p.hasSurgery).length
    const totalNoSurgery = patientFlows.filter((p) => !p.hasSurgery).length

    return {
      flows: { top5Diseases, diseaseAgg, surgeryStatus, totalSurgery, totalNoSurgery, patientFlows },
      summary: {
        total: patientFlows.length,
        totalSurgery,
        totalNoSurgery,
        loyal: surgeryStatus.surgery.loyal + surgeryStatus.no_surgery.loyal,
        atRisk: surgeryStatus.surgery.atRisk + surgeryStatus.no_surgery.atRisk,
        newPt: surgeryStatus.surgery.newPt + surgeryStatus.no_surgery.newPt,
      },
    }
  }, [data])

  if (!flows || !summary) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><GitMerge className="h-5 w-5" />환자 여정 분석</CardTitle></CardHeader>
        <CardContent><div className="text-center py-12 text-muted-foreground">데이터가 없습니다.</div></CardContent>
      </Card>
    )
  }

  const { top5Diseases, diseaseAgg, surgeryStatus } = flows

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: '분석 대상 환자', value: summary.total, color: 'text-gray-700' },
          { label: '수술 받은 환자', value: summary.totalSurgery, color: 'text-purple-600' },
          { label: '수술 미시행', value: summary.totalNoSurgery, color: 'text-slate-500' },
          { label: '충성 환자 (4회+)', value: summary.loyal, color: 'text-emerald-600' },
          { label: '이탈 위험 (2~3회)', value: summary.atRisk, color: 'text-orange-500' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 질병 → 수술 여부 플로우 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            환자 여정 흐름도 (질병 → 수술 여부 → 보유 상태)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            상위 5개 질환 기준. 각 블록의 너비는 환자 비율을 나타냅니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1단계: 질환 분포 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">1단계 — 주요 질환</p>
            <div className="flex gap-1 h-10">
              {top5Diseases.map((disease, i) => {
                const agg = diseaseAgg.get(disease)!
                const total = agg.withSurgery + agg.withoutSurgery
                const pct = summary.total > 0 ? (total / summary.total) * 100 : 0
                const colors = ['bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-indigo-500', 'bg-indigo-600']
                return (
                  <div
                    key={disease}
                    className={`${colors[i]} rounded text-white text-xs flex items-center justify-center overflow-hidden cursor-default`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                    title={`${disease}: ${total}명 (${pct.toFixed(1)}%)`}
                  >
                    {pct > 8 && <span className="px-1 truncate">{disease.substring(0, 5)}</span>}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {top5Diseases.map((disease, i) => {
                const agg = diseaseAgg.get(disease)!
                const total = agg.withSurgery + agg.withoutSurgery
                const colors = ['bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-indigo-500', 'bg-indigo-600']
                return (
                  <div key={disease} className="flex items-center gap-1 text-xs">
                    <span className={`w-3 h-3 rounded ${colors[i]}`} />
                    <span>{disease}</span>
                    <span className="text-muted-foreground">({total.toLocaleString()}명)</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2단계: 수술 여부 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">2단계 — 수술 여부</p>
            <div className="flex gap-3">
              {[
                { key: 'surgery', label: '수술 시행', count: flows.totalSurgery, color: 'bg-purple-500' },
                { key: 'no_surgery', label: '수술 미시행', count: flows.totalNoSurgery, color: 'bg-slate-400' },
              ].map(({ label, count, color }) => {
                const pct = summary.total > 0 ? ((count / summary.total) * 100).toFixed(1) : '0'
                return (
                  <div key={label} className={`${color} rounded-lg p-3 text-white flex-1`}>
                    <div className="text-lg font-bold">{count.toLocaleString()}명</div>
                    <div className="text-xs opacity-90">{label} ({pct}%)</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3단계: 보유 상태 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">3단계 — 보유 상태</p>
            <div className="grid grid-cols-2 gap-3">
              {(['surgery', 'no_surgery'] as const).map((key) => {
                const label = key === 'surgery' ? '수술 환자' : '비수술 환자'
                const status = surgeryStatus[key]
                const total = status.loyal + status.atRisk + status.newPt
                return (
                  <div key={key} className="border rounded-lg p-3">
                    <p className="text-xs font-medium mb-2">{label} ({total.toLocaleString()}명)</p>
                    <div className="space-y-1">
                      {[
                        { label: '충성 (4회+)', value: status.loyal, color: 'bg-emerald-500' },
                        { label: '이탈 위험 (2~3회)', value: status.atRisk, color: 'bg-orange-400' },
                        { label: '신규 (1회)', value: status.newPt, color: 'bg-gray-300' },
                      ].map(({ label: l, value, color }) => (
                        <div key={l} className="flex items-center gap-2 text-xs">
                          <span className={`w-2 h-2 rounded-full ${color}`} />
                          <span className="w-28">{l}</span>
                          <div className={`h-3 rounded ${color} opacity-80`} style={{ width: `${total > 0 ? (value / total) * 120 : 0}px`, minWidth: value > 0 ? 4 : 0 }} />
                          <span className="font-medium">{value.toLocaleString()}명</span>
                          <span className="text-muted-foreground">
                            ({total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 인사이트 */}
          <div className="p-3 bg-muted/40 rounded-lg">
            <p className="text-xs font-semibold mb-1">🔍 자동 인사이트</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              {flows.totalSurgery > 0 && (
                <li>
                  수술 환자의 충성 비율:{' '}
                  <strong>{flows.totalSurgery > 0 ? ((surgeryStatus.surgery.loyal / flows.totalSurgery) * 100).toFixed(0) : 0}%</strong> —
                  수술 후 지속 관리 프로그램이 효과적일 수 있습니다.
                </li>
              )}
              {flows.totalNoSurgery > 0 && (
                <li>
                  비수술 환자의 이탈 위험 비율:{' '}
                  <strong>{((surgeryStatus.no_surgery.atRisk / Math.max(flows.totalNoSurgery, 1)) * 100).toFixed(0)}%</strong> —
                  보존적 치료 환자의 추적 관리가 필요합니다.
                </li>
              )}
              <li>
                신규 환자(1회 방문):{' '}
                <strong>{summary.newPt.toLocaleString()}명 ({summary.total > 0 ? ((summary.newPt / summary.total) * 100).toFixed(0) : 0}%)</strong> —
                초진 후 30일 이내 추적 연락을 권고합니다.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
