import { describe, expect, it } from 'vitest'
import type { PatientData } from '@/stores/data-store'
import {
  computeRetentionSummary,
  computeMonthlyUniquePatientGrowth,
  getDataReferenceDate,
  isReturningWithinWindow,
} from './strategy-metrics'

function makePatient(overrides: Partial<PatientData> = {}): PatientData {
  return {
    patient_id: 'P1',
    name: '홍길동',
    visit_date: '2024-01-01',
    age: 40,
    gender: '남성',
    disease_code: 'M',
    disease_name: '무릎',
    address: '서울',
    region: '서울 강남구',
    ...overrides,
  }
}

describe('isReturningWithinWindow', () => {
  it('returns false for single visit', () => {
    expect(isReturningWithinWindow([makePatient()], 90)).toBe(false)
  })

  it('returns true when interval within window', () => {
    const visits = [
      makePatient({ visit_date: '2024-01-01' }),
      makePatient({ visit_date: '2024-02-01' }),
    ]
    expect(isReturningWithinWindow(visits, 90)).toBe(true)
  })

  it('returns false when interval exceeds window', () => {
    const visits = [
      makePatient({ visit_date: '2024-01-01' }),
      makePatient({ visit_date: '2024-06-01' }),
    ]
    expect(isReturningWithinWindow(visits, 90)).toBe(false)
  })
})

describe('computeRetentionSummary', () => {
  it('counts window-based returning patients', () => {
    const data = [
      makePatient({ patient_id: 'A', visit_date: '2024-01-01' }),
      makePatient({ patient_id: 'A', visit_date: '2024-01-20' }),
      makePatient({ patient_id: 'B', visit_date: '2024-01-01' }),
      makePatient({ patient_id: 'B', visit_date: '2024-08-01' }),
      makePatient({ patient_id: 'C', visit_date: '2024-01-01' }),
    ]
    const s = computeRetentionSummary(data, 90)
    expect(s.uniquePatients).toBe(3)
    expect(s.returningPatients).toBe(1)
    expect(s.newPatients).toBe(2)
  })
})

describe('computeMonthlyUniquePatientGrowth', () => {
  it('uses unique patients not visit rows', () => {
    const data = [
      makePatient({ patient_id: 'A', visit_date: '2024-01-05' }),
      makePatient({ patient_id: 'A', visit_date: '2024-01-20' }),
      makePatient({ patient_id: 'B', visit_date: '2024-02-01' }),
      makePatient({ patient_id: 'C', visit_date: '2024-02-10' }),
    ]
    // Jan unique=1, Feb unique=2 → +100%
    expect(computeMonthlyUniquePatientGrowth(data)).toBe(100)
  })
})

describe('getDataReferenceDate', () => {
  it('returns max visit date in dataset', () => {
    const data = [
      makePatient({ visit_date: '2024-01-01' }),
      makePatient({ visit_date: '2024-06-15' }),
    ]
    expect(getDataReferenceDate(data).toISOString().slice(0, 10)).toBe(
      '2024-06-15'
    )
  })
})
