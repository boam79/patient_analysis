import { describe, it, expect } from 'vitest'
import {
  resolvePatientId,
  groupVisitsByPatient,
  countUniquePatients,
  countReturningPatients,
  calcVisitIntervals,
} from './patient-identity'
import type { PatientData } from '@/stores/data-store'

function makePatient(overrides: Partial<PatientData> = {}): PatientData {
  return {
    patient_id: '',
    name: '홍길동',
    visit_date: '2024-01-01',
    age: 40,
    gender: 'M',
    disease_code: 'D001',
    disease_name: '고혈압',
    address: '서울특별시 강남구',
    region: '서울특별시 강남구',
    ...overrides,
  }
}

describe('resolvePatientId', () => {
  it('patient_id가 존재하면 이를 우선 사용한다', () => {
    const patient = makePatient({ patient_id: 'P123' })
    expect(resolvePatientId(patient)).toBe('P123')
  })

  it('patient_id의 앞뒤 공백을 제거한다', () => {
    const patient = makePatient({ patient_id: '  P123  ' })
    expect(resolvePatientId(patient)).toBe('P123')
  })

  it('patient_id가 빈 문자열이면 이름+주소로 폴백한다', () => {
    const patient = makePatient({ patient_id: '', name: '홍길동', address: '서울특별시 강남구' })
    expect(resolvePatientId(patient)).toBe('홍길동|서울특별시 강남구')
  })

  it('patient_id가 공백만 있는 경우도 폴백 처리한다', () => {
    const patient = makePatient({ patient_id: '   ' })
    expect(resolvePatientId(patient)).toBe('홍길동|서울특별시 강남구')
  })

  it('patient_id가 undefined인 경우도 폴백 처리한다', () => {
    const patient = makePatient({ patient_id: undefined as unknown as string })
    expect(resolvePatientId(patient)).toBe('홍길동|서울특별시 강남구')
  })
})

describe('groupVisitsByPatient', () => {
  it('동일 환자의 방문 기록을 하나의 그룹으로 묶는다', () => {
    const data = [
      makePatient({ patient_id: 'P1', visit_date: '2024-01-01' }),
      makePatient({ patient_id: 'P1', visit_date: '2024-02-01' }),
      makePatient({ patient_id: 'P2', visit_date: '2024-01-15' }),
    ]
    const grouped = groupVisitsByPatient(data)
    expect(grouped.size).toBe(2)
    expect(grouped.get('P1')).toHaveLength(2)
    expect(grouped.get('P2')).toHaveLength(1)
  })

  it('각 환자의 방문 기록을 날짜 오름차순으로 정렬한다', () => {
    const data = [
      makePatient({ patient_id: 'P1', visit_date: '2024-03-01' }),
      makePatient({ patient_id: 'P1', visit_date: '2024-01-01' }),
      makePatient({ patient_id: 'P1', visit_date: '2024-02-01' }),
    ]
    const grouped = groupVisitsByPatient(data)
    const visits = grouped.get('P1')!
    expect(visits.map((v) => v.visit_date)).toEqual(['2024-01-01', '2024-02-01', '2024-03-01'])
  })

  it('빈 배열을 입력하면 빈 Map을 반환한다', () => {
    expect(groupVisitsByPatient([]).size).toBe(0)
  })

  it('patient_id 없이 이름+주소가 같은 환자는 같은 그룹으로 묶인다', () => {
    const data = [
      makePatient({ patient_id: '', name: '김철수', address: '서울특별시 서초구', visit_date: '2024-01-01' }),
      makePatient({ patient_id: '', name: '김철수', address: '서울특별시 서초구', visit_date: '2024-02-01' }),
    ]
    const grouped = groupVisitsByPatient(data)
    expect(grouped.size).toBe(1)
    expect(grouped.get('김철수|서울특별시 서초구')).toHaveLength(2)
  })
})

describe('countUniquePatients', () => {
  it('중복 환자를 제거하고 고유 환자 수를 반환한다', () => {
    const data = [
      makePatient({ patient_id: 'P1' }),
      makePatient({ patient_id: 'P1' }),
      makePatient({ patient_id: 'P2' }),
    ]
    expect(countUniquePatients(data)).toBe(2)
  })

  it('빈 배열은 0을 반환한다', () => {
    expect(countUniquePatients([])).toBe(0)
  })
})

describe('countReturningPatients', () => {
  it('2회 이상 방문한 환자만 카운트한다', () => {
    const data = [
      makePatient({ patient_id: 'P1', visit_date: '2024-01-01' }),
      makePatient({ patient_id: 'P1', visit_date: '2024-02-01' }),
      makePatient({ patient_id: 'P2', visit_date: '2024-01-01' }),
    ]
    const grouped = groupVisitsByPatient(data)
    expect(countReturningPatients(grouped)).toBe(1)
  })

  it('모든 환자가 1회만 방문한 경우 0을 반환한다', () => {
    const data = [
      makePatient({ patient_id: 'P1' }),
      makePatient({ patient_id: 'P2' }),
    ]
    const grouped = groupVisitsByPatient(data)
    expect(countReturningPatients(grouped)).toBe(0)
  })

  it('빈 Map은 0을 반환한다', () => {
    expect(countReturningPatients(new Map())).toBe(0)
  })
})

describe('calcVisitIntervals', () => {
  it('방문이 1건 이하면 빈 배열을 반환한다', () => {
    expect(calcVisitIntervals([makePatient()])).toEqual([])
    expect(calcVisitIntervals([])).toEqual([])
  })

  it('연속 방문 간격을 일 단위로 계산한다', () => {
    const visits = [
      makePatient({ visit_date: '2024-01-01' }),
      makePatient({ visit_date: '2024-01-11' }),
      makePatient({ visit_date: '2024-02-10' }),
    ]
    const intervals = calcVisitIntervals(visits)
    expect(intervals).toEqual([10, 30])
  })

  it('windowDays를 지정하면 해당 일수를 초과하는 간격은 제외한다', () => {
    const visits = [
      makePatient({ visit_date: '2024-01-01' }),
      makePatient({ visit_date: '2024-01-11' }), // 10일 간격 (윈도우 내)
      makePatient({ visit_date: '2024-06-01' }), // 100일 이상 간격 (윈도우 밖)
    ]
    const intervals = calcVisitIntervals(visits, 30)
    expect(intervals).toEqual([10])
  })

  it('windowDays 경계값(정확히 일치)은 포함한다', () => {
    const visits = [
      makePatient({ visit_date: '2024-01-01' }),
      makePatient({ visit_date: '2024-01-31' }), // 정확히 30일
    ]
    expect(calcVisitIntervals(visits, 30)).toEqual([30])
  })
})
