'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GitMerge } from 'lucide-react'
import type { PatientData } from '@/stores/data-store'
import { groupVisitsByPatient } from '@/lib/utils/patient-identity'
import { hasSurgery } from '@/lib/utils/analysis-helpers'

interface PatientJourneyProps {
  data: PatientData[]
}

export function PatientJourney({ data }: PatientJourneyProps) {
  const { flows, summary } = useMemo(() => {
    if (!data || data.length === 0) return { flows: null, summary: null }

    const visitsByPatient = groupVisitsByPatient(data)

    const diseaseCounts = new Map<string, number>()
    visitsByPatient.forEach((visits) => {
      const diseases = Array.from(new Set(visits.map((v) => v.disease_name)))
      diseases.forEach((d) => diseaseCounts.set(d, (diseaseCounts.get(d) ?? 0) + 1))
    })
    const top5Diseases = Array.from(diseaseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([d]) => d)

    type PatientFlow = {
      disease: string
      hasSurgery: boolean
      visitCount: number
    }

    const patientFlows: PatientFlow[] = []
    let excluded = 0
    visitsByPatient.forEach((visits) => {
      const primaryDisease = visits[0]?.disease_name
      if (!primaryDisease || !top5Diseases.includes(primaryDisease)) {
        excluded++
        return
      }
      patientFlows.push({
        disease: primaryDisease,
        hasSurgery: visits.some((v) => hasSurgery(v)),
        visitCount: visits.length,
      })
    })

    type Agg = { withSurgery: number; withoutSurgery: number }
    const diseaseAgg = new Map<string, Agg>()
    top5Diseases.forEach((d) => diseaseAgg.set(d, { withSurgery: 0, withoutSurgery: 0 }))

    patientFlows.forEach((pf) => {
      const agg = diseaseAgg.get(pf.disease)
      if (!agg) return
      if (pf.hasSurgery) agg.withSurgery++
      else agg.withoutSurgery++
    })

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
      flows: {
        top5Diseases,
        diseaseAgg,
        surgeryStatus,
        totalSurgery,
        totalNoSurgery,
      },
      summary: {
        total: patientFlows.length,
        excluded,
        withSurgery: totalSurgery,
        withoutSurgery: totalNoSurgery,
      },
    }
  }, [data])

  if (!flows || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            환자 여정 흐름
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="h-5 w-5" />
          환자 여정 흐름
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          상위 5개 질환 기준 · 포함 {summary.total.toLocaleString()}명
          {summary.excluded > 0
            ? ` (상위 질환 외 ${summary.excluded.toLocaleString()}명 제외)`
            : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          {flows.top5Diseases.map((disease) => {
            const agg = flows.diseaseAgg.get(disease)!
            const total = agg.withSurgery + agg.withoutSurgery
            return (
              <div key={disease} className="rounded-lg border p-3">
                <div className="font-medium text-sm mb-2">{disease}</div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>수술 {agg.withSurgery}명</span>
                  <span>비수술 {agg.withoutSurgery}명</span>
                  <span>합계 {total}명</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">수술 환자 ({flows.totalSurgery}명)</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>충성(4회+): {flows.surgeryStatus.surgery.loyal}</div>
              <div>관심(2–3회): {flows.surgeryStatus.surgery.atRisk}</div>
              <div>신규(1회): {flows.surgeryStatus.surgery.newPt}</div>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">비수술 환자 ({flows.totalNoSurgery}명)</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>충성(4회+): {flows.surgeryStatus.no_surgery.loyal}</div>
              <div>관심(2–3회): {flows.surgeryStatus.no_surgery.atRisk}</div>
              <div>신규(1회): {flows.surgeryStatus.no_surgery.newPt}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
