import type { PatientData } from '@/stores/data-store'
import {
  groupVisitsByPatient,
  resolvePatientId,
} from '@/lib/utils/patient-identity'

export interface MonthlyTrendPoint {
  month: string
  recurrenceRate: number
  newPatients: number
  returningPatients: number
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * 월별 신규/재방문 집계.
 * - 환자 생애 첫 방문 월 → 신규
 * - 이후 방문 월 → 재방문
 * - 라벨: `YYYY년 M월` (연도 충돌 방지)
 * windowSize는 호환용으로 받지만, 신규/재방문 분류에는 사용하지 않음
 * (재방문율 KPI의 윈도우 로직과 분리).
 */
export function computeMonthlyTrend(
  data: PatientData[],
  _windowSize = 90
): MonthlyTrendPoint[] {
  if (!data.length) return []

  const byPatient = groupVisitsByPatient(data)
  const monthMap = new Map<
    string,
    { newIds: Set<string>; returningIds: Set<string> }
  >()

  byPatient.forEach((visits, patientId) => {
    visits.forEach((visit, index) => {
      const d = new Date(visit.visit_date)
      if (Number.isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const bucket = monthMap.get(key) ?? {
        newIds: new Set<string>(),
        returningIds: new Set<string>(),
      }
      if (index === 0) {
        bucket.newIds.add(patientId)
      } else {
        bucket.returningIds.add(patientId)
      }
      monthMap.set(key, bucket)
    })
  })

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, bucket]) => {
      const [y, m] = ym.split('-')
      const newPatients = bucket.newIds.size
      const returningPatients = bucket.returningIds.size
      const total = newPatients + returningPatients
      return {
        month: `${y}년 ${Number(m)}월`,
        newPatients,
        returningPatients,
        recurrenceRate:
          total > 0 ? Math.round((returningPatients / total) * 1000) / 10 : 0,
      }
    })
}

export function computeDiseaseRecurrenceRates(
  data: PatientData[],
  windowSize = 90
): Map<string, number> {
  const rates = new Map<string, number>()
  if (!data.length) return rates

  const byDiseasePatients = new Map<string, Map<string, PatientData[]>>()

  data.forEach((row) => {
    const disease = row.disease_name
    if (!disease) return
    const pid = resolvePatientId(row)
    if (!byDiseasePatients.has(disease)) {
      byDiseasePatients.set(disease, new Map())
    }
    const patients = byDiseasePatients.get(disease)!
    const visits = patients.get(pid) ?? []
    visits.push(row)
    patients.set(pid, visits)
  })

  byDiseasePatients.forEach((patients, disease) => {
    let returning = 0
    let total = 0
    patients.forEach((visits) => {
      total++
      const sorted = [...visits].sort(
        (a, b) =>
          new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
      )
      if (sorted.length < 2) return
      for (let i = 1; i < sorted.length; i++) {
        const interval =
          (new Date(sorted[i].visit_date).getTime() -
            new Date(sorted[i - 1].visit_date).getTime()) /
          MS_PER_DAY
        if (interval <= windowSize) {
          returning++
          return
        }
      }
    })
    rates.set(
      disease,
      total > 0 ? Math.round((returning / total) * 1000) / 10 : 0
    )
  })

  return rates
}
