import type { PatientData } from '@/stores/data-store'
import {
  groupVisitsByPatient,
  resolvePatientId,
} from '@/lib/utils/patient-identity'
import { extractMonth } from '@/lib/utils/date-helpers'
import { isReturningWithinWindow } from '@/lib/utils/strategy-metrics'

export interface MonthlyTrendPoint {
  month: string
  /** 해당 월 방문자 중 생애 재방문(첫 방문 이후) 비중 — KPI 윈도우 재방문율과 다름 */
  lifetimeReturnShare: number
  /** @deprecated lifetimeReturnShare와 동일 — 차트 dataKey 호환 */
  recurrenceRate: number
  newPatients: number
  returningPatients: number
}

/**
 * 월별 신규/생애재방문 집계.
 * - 환자 생애 첫 방문 월 → 신규
 * - 이후 방문 월 → 생애 재방문
 * - 라벨: `YYYY년 M월`
 * windowSize는 API 호환용으로만 받으며 분류에 사용하지 않음.
 */
export function computeMonthlyTrend(
  data: PatientData[],
  _windowSize = 90
): MonthlyTrendPoint[] {
  void _windowSize
  if (!data.length) return []

  const byPatient = groupVisitsByPatient(data)
  const monthMap = new Map<
    string,
    { newIds: Set<string>; returningIds: Set<string> }
  >()

  byPatient.forEach((visits, patientId) => {
    visits.forEach((visit, index) => {
      const key = extractMonth(visit.visit_date)
      if (!key) return
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
      const share =
        total > 0 ? Math.round((returningPatients / total) * 1000) / 10 : 0
      return {
        month: `${y}년 ${Number(m)}월`,
        newPatients,
        returningPatients,
        lifetimeReturnShare: share,
        recurrenceRate: share,
      }
    })
}

export interface DiseaseRecurrenceStat {
  disease: string
  total: number
  returning: number
  rate: number
}

/**
 * 질병별 윈도우 재방문 — 분모·분자는 「해당 질병 방문이 있는 환자」로 통일
 */
export function computeDiseaseRecurrenceStats(
  data: PatientData[],
  windowSize = 90
): DiseaseRecurrenceStat[] {
  if (!data.length) return []

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

  const stats: DiseaseRecurrenceStat[] = []
  byDiseasePatients.forEach((patients, disease) => {
    let returning = 0
    let total = 0
    patients.forEach((visits) => {
      total++
      if (isReturningWithinWindow(visits, windowSize)) returning++
    })
    stats.push({
      disease,
      total,
      returning,
      rate: total > 0 ? Math.round((returning / total) * 1000) / 10 : 0,
    })
  })

  return stats.sort((a, b) => b.total - a.total)
}

export function computeDiseaseRecurrenceRates(
  data: PatientData[],
  windowSize = 90
): Map<string, number> {
  const rates = new Map<string, number>()
  for (const s of computeDiseaseRecurrenceStats(data, windowSize)) {
    rates.set(s.disease, s.rate)
  }
  return rates
}
