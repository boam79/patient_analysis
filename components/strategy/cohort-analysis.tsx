'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import type { PatientData } from '@/stores/data-store'
import { resolvePatientId, groupVisitsByPatient } from '@/lib/utils/patient-identity'

interface CohortAnalysisProps {
  data: PatientData[]
}

interface CohortRow {
  cohortMonth: string   // "2024-01"
  label: string         // "2024년 1월"
  cohortSize: number
  retention: (number | null)[]  // 인덱스 0 = 1개월차, 1 = 2개월차 ...
}

function retentionColor(rate: number | null): string {
  if (rate === null) return 'bg-gray-100 text-gray-400'
  if (rate >= 70) return 'bg-emerald-600 text-white'
  if (rate >= 50) return 'bg-emerald-400 text-white'
  if (rate >= 30) return 'bg-yellow-400 text-gray-900'
  if (rate >= 15) return 'bg-orange-400 text-white'
  return 'bg-red-400 text-white'
}

export function CohortAnalysis({ data }: CohortAnalysisProps) {
  const cohortData = useMemo<CohortRow[]>(() => {
    if (!data || data.length === 0) return []

    // 환자별 방문 기록 (날짜 오름차순)
    const visitsByPatient = groupVisitsByPatient(data)

    // 각 환자의 첫 방문 코호트 월 결정
    const patientCohort = new Map<string, string>() // patientId → "YYYY-MM"
    visitsByPatient.forEach((visits, pid) => {
      const firstDate = new Date(visits[0].visit_date)
      const cohortMonth = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`
      patientCohort.set(pid, cohortMonth)
    })

    // 코호트별 전체 환자 목록
    const cohortPatients = new Map<string, Set<string>>()
    patientCohort.forEach((cohort, pid) => {
      const set = cohortPatients.get(cohort) ?? new Set()
      set.add(pid)
      cohortPatients.set(cohort, set)
    })

    // 각 환자가 특정 월에 방문했는지 기록
    const patientVisitMonths = new Map<string, Set<string>>() // patientId → Set<"YYYY-MM">
    visitsByPatient.forEach((visits, pid) => {
      const months = new Set<string>()
      visits.forEach((v) => {
        const d = new Date(v.visit_date)
        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
      })
      patientVisitMonths.set(pid, months)
    })

    // 코호트 목록 정렬
    const cohortMonths = Array.from(cohortPatients.keys()).sort()
    if (cohortMonths.length === 0) return []

    const maxPeriods = 12 // 최대 12개월 추적

    return cohortMonths.map((cohortMonth) => {
      const patients = cohortPatients.get(cohortMonth)!
      const cohortSize = patients.size
      const [cy, cm] = cohortMonth.split('-').map(Number)

      const retention: (number | null)[] = []

      for (let period = 1; period <= maxPeriods; period++) {
        // 코호트 월 + period 개월 후
        const targetYear = cy + Math.floor((cm - 1 + period) / 12)
        const targetMonth = ((cm - 1 + period) % 12) + 1
        const targetKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`

        // 해당 월이 아직 데이터에 없으면 null (미래)
        const allMonths = new Set<string>()
        patientVisitMonths.forEach((months) => months.forEach((m) => allMonths.add(m)))
        if (!allMonths.has(targetKey)) {
          retention.push(null)
          continue
        }

        // 코호트 환자 중 해당 월에 재방문한 수
        let retained = 0
        patients.forEach((pid) => {
          if (patientVisitMonths.get(pid)?.has(targetKey)) retained++
        })
        retention.push(cohortSize > 0 ? Math.round((retained / cohortSize) * 100) : 0)
      }

      const [y, m] = cohortMonth.split('-')
      return {
        cohortMonth,
        label: `${y}년 ${parseInt(m)}월`,
        cohortSize,
        retention,
      }
    })
  }, [data])

  if (!cohortData || cohortData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            코호트 보유율 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            분석할 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxPeriods = Math.max(...cohortData.map((r) => r.retention.length))
  const periodLabels = Array.from({ length: maxPeriods }, (_, i) => `+${i + 1}개월`)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            코호트 보유율 히트맵
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            첫 방문 월 기준으로 이후 각 월에 재방문한 환자 비율. 색상이 진할수록 보유율이 높습니다.
          </p>
        </CardHeader>
        <CardContent>
          {/* 범례 */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs text-muted-foreground">보유율:</span>
            {[
              { label: '70%+', cls: 'bg-emerald-600 text-white' },
              { label: '50~70%', cls: 'bg-emerald-400 text-white' },
              { label: '30~50%', cls: 'bg-yellow-400 text-gray-900' },
              { label: '15~30%', cls: 'bg-orange-400 text-white' },
              { label: '<15%', cls: 'bg-red-400 text-white' },
              { label: '데이터 없음', cls: 'bg-gray-100 text-gray-400' },
            ].map((item) => (
              <span
                key={item.label}
                className={`text-xs px-2 py-0.5 rounded ${item.cls}`}
              >
                {item.label}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 font-medium bg-muted/50 min-w-[110px]">코호트 월</th>
                  <th className="text-center p-2 font-medium bg-muted/50 min-w-[60px]">신규 환자</th>
                  {periodLabels.map((label) => (
                    <th key={label} className="text-center p-2 font-medium bg-muted/50 min-w-[52px]">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row) => (
                  <tr key={row.cohortMonth} className="border-t">
                    <td className="p-2 font-medium">{row.label}</td>
                    <td className="text-center p-2">
                      <Badge variant="outline">{row.cohortSize.toLocaleString()}명</Badge>
                    </td>
                    {row.retention.map((rate, i) => (
                      <td key={i} className="p-1 text-center">
                        <span
                          className={`inline-block w-full rounded text-center py-1 px-1 font-semibold ${retentionColor(rate)}`}
                        >
                          {rate === null ? '-' : `${rate}%`}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        {(() => {
          const firstMonthRates = cohortData
            .map((r) => r.retention[0])
            .filter((r): r is number => r !== null)
          const avg1m =
            firstMonthRates.length > 0
              ? Math.round(firstMonthRates.reduce((s, v) => s + v, 0) / firstMonthRates.length)
              : 0

          const thirdMonthRates = cohortData
            .map((r) => r.retention[2])
            .filter((r): r is number => r !== null)
          const avg3m =
            thirdMonthRates.length > 0
              ? Math.round(thirdMonthRates.reduce((s, v) => s + v, 0) / thirdMonthRates.length)
              : 0

          const sixthMonthRates = cohortData
            .map((r) => r.retention[5])
            .filter((r): r is number => r !== null)
          const avg6m =
            sixthMonthRates.length > 0
              ? Math.round(sixthMonthRates.reduce((s, v) => s + v, 0) / sixthMonthRates.length)
              : 0

          return (
            <>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-emerald-600">{avg1m}%</div>
                  <div className="text-sm text-muted-foreground">1개월 평균 보유율</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-yellow-600">{avg3m}%</div>
                  <div className="text-sm text-muted-foreground">3개월 평균 보유율</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-orange-600">{avg6m}%</div>
                  <div className="text-sm text-muted-foreground">6개월 평균 보유율</div>
                </CardContent>
              </Card>
            </>
          )
        })()}
      </div>
    </div>
  )
}
