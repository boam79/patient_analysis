import type { PatientData } from '@/stores/data-store'
import {
  groupVisitsByPatient,
  resolvePatientId,
} from '@/lib/utils/patient-identity'
import { extractMonth, parseDate } from '@/lib/utils/date-helpers'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export const DEFAULT_STRATEGY_WINDOW = 90

/** 윈도우 내 재방문 여부 (대시보드 KPI와 동일 정의) */
export function isReturningWithinWindow(
  visits: PatientData[],
  windowSize: number
): boolean {
  if (visits.length < 2) return false
  const sorted = [...visits].sort(
    (a, b) =>
      new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
  )
  for (let i = 1; i < sorted.length; i++) {
    const interval =
      (new Date(sorted[i].visit_date).getTime() -
        new Date(sorted[i - 1].visit_date).getTime()) /
      MS_PER_DAY
    if (interval <= windowSize) return true
  }
  return false
}

export interface RetentionSummary {
  uniquePatients: number
  returningPatients: number
  newPatients: number
  retentionRate: number
  intervalsWithinWindow: number[]
  avgInterval: number
}

/** 환자 Map 기준 윈도우 재방문 집계 */
export function computeRetentionSummary(
  data: PatientData[],
  windowSize: number = DEFAULT_STRATEGY_WINDOW
): RetentionSummary {
  const byPatient = groupVisitsByPatient(data)
  const uniquePatients = byPatient.size
  let returningPatients = 0
  const intervalsWithinWindow: number[] = []

  byPatient.forEach((visits) => {
    if (visits.length < 2) return
    let returned = false
    for (let i = 1; i < visits.length; i++) {
      const interval =
        (new Date(visits[i].visit_date).getTime() -
          new Date(visits[i - 1].visit_date).getTime()) /
        MS_PER_DAY
      if (interval <= windowSize) {
        intervalsWithinWindow.push(interval)
        returned = true
      }
    }
    if (returned) returningPatients++
  })

  return {
    uniquePatients,
    returningPatients,
    newPatients: uniquePatients - returningPatients,
    retentionRate:
      uniquePatients > 0 ? (returningPatients / uniquePatients) * 100 : 0,
    intervalsWithinWindow,
    avgInterval:
      intervalsWithinWindow.length > 0
        ? Math.round(
            intervalsWithinWindow.reduce((s, v) => s + v, 0) /
              intervalsWithinWindow.length
          )
        : 0,
  }
}

/** 월별 고유 환자 수 기준 MoM 성장률 (%) */
export function computeMonthlyUniquePatientGrowth(data: PatientData[]): number {
  const monthly = new Map<string, Set<string>>()
  data.forEach((p) => {
    const month = extractMonth(p.visit_date)
    if (!month) return
    if (!monthly.has(month)) monthly.set(month, new Set())
    monthly.get(month)!.add(resolvePatientId(p))
  })

  const sorted = Array.from(monthly.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  if (sorted.length < 2) return 0
  const last = sorted[sorted.length - 1][1].size
  const prev = sorted[sorted.length - 2][1].size
  return prev > 0 ? ((last - prev) / prev) * 100 : 0
}

/** 데이터셋 내 최신 방문일을 기준일로 (RFM 등). 없으면 오늘. */
export function getDataReferenceDate(data: PatientData[]): Date {
  let max = 0
  data.forEach((p) => {
    const d = parseDate(p.visit_date)
    if (d) max = Math.max(max, d.getTime())
  })
  return max > 0 ? new Date(max) : new Date()
}
