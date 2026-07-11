import type { PatientData } from '@/stores/data-store'

/**
 * 단일 환자 식별자 정책
 *
 * 우선순위:
 *   1. patient_id 필드 (비어있지 않은 경우)
 *   2. 이름 + 주소 (폴백)
 *
 * 이 함수를 통해 data-store, 전략 컴포넌트, 대시보드 모두 동일한 기준으로 환자를 식별합니다.
 */
export function resolvePatientId(
  row: Pick<PatientData, 'patient_id' | 'name' | 'address'>
): string {
  if (row.patient_id && row.patient_id.trim()) return row.patient_id.trim()
  return `${row.name}|${row.address}`
}

/**
 * 방문 기록 배열에서 고유 환자 Map을 반환합니다.
 * key: resolvePatientId 결과, value: 해당 환자의 모든 방문 기록 (날짜 오름차순)
 */
export function groupVisitsByPatient(
  data: PatientData[]
): Map<string, PatientData[]> {
  const map = new Map<string, PatientData[]>()
  data.forEach((row) => {
    const id = resolvePatientId(row)
    const visits = map.get(id) ?? []
    visits.push(row)
    map.set(id, visits)
  })
  // 각 환자의 방문을 날짜 오름차순으로 정렬
  map.forEach((visits) => {
    visits.sort(
      (a, b) =>
        new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
    )
  })
  return map
}

/**
 * 고유 환자 수를 반환합니다.
 */
export function countUniquePatients(data: PatientData[]): number {
  return new Set(data.map(resolvePatientId)).size
}

/**
 * 재방문 환자 수 (2회 이상 방문한 고유 환자)
 */
export function countReturningPatients(
  visitsByPatient: Map<string, PatientData[]>
): number {
  let count = 0
  visitsByPatient.forEach((visits) => {
    if (visits.length > 1) count++
  })
  return count
}

/**
 * 재방문 간격 배열 계산 (일 단위)
 * windowDays가 있으면 해당 일수 이내 간격만 포함합니다.
 */
export function calcVisitIntervals(
  visits: PatientData[],
  windowDays?: number
): number[] {
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const intervals: number[] = []
  for (let i = 1; i < visits.length; i++) {
    const interval =
      (new Date(visits[i].visit_date).getTime() -
        new Date(visits[i - 1].visit_date).getTime()) /
      MS_PER_DAY
    if (windowDays === undefined || interval <= windowDays) {
      intervals.push(interval)
    }
  }
  return intervals
}
