import { describe, expect, it } from 'vitest'
import type { PatientData } from '@/stores/data-store'
import {
  computeMonthlyTrend,
  computeDiseaseRecurrenceRates,
} from '@/lib/utils/monthly-trend'

const sample: PatientData[] = [
  {
    patient_id: 'p1',
    name: 'A',
    visit_date: '2024-01-10',
    age: 40,
    gender: '남성',
    disease_code: 'M1',
    disease_name: '무릎관절증',
    address: '서울 강남',
    region: '서울 강남구',
  },
  {
    patient_id: 'p1',
    name: 'A',
    visit_date: '2024-02-05',
    age: 40,
    gender: '남성',
    disease_code: 'M1',
    disease_name: '무릎관절증',
    address: '서울 강남',
    region: '서울 강남구',
  },
  {
    patient_id: 'p2',
    name: 'B',
    visit_date: '2024-02-12',
    age: 50,
    gender: '여성',
    disease_code: 'M2',
    disease_name: '고혈압',
    address: '서울 서초',
    region: '서울 서초구',
  },
  {
    patient_id: 'p3',
    name: 'C',
    visit_date: '2025-01-03',
    age: 30,
    gender: '남성',
    disease_code: 'M1',
    disease_name: '무릎관절증',
    address: '서울 마포',
    region: '서울 마포구',
  },
]

describe('computeMonthlyTrend', () => {
  it('aggregates new vs returning by month with year labels', () => {
    const trend = computeMonthlyTrend(sample, 90)
    expect(trend.some((t) => t.month === '2024년 1월')).toBe(true)
    expect(trend.some((t) => t.month === '2025년 1월')).toBe(true)
    const feb = trend.find((t) => t.month === '2024년 2월')
    expect(feb).toBeTruthy()
    expect(feb!.returningPatients).toBeGreaterThanOrEqual(1)
    expect(feb!.newPatients).toBeGreaterThanOrEqual(1)
  })
})

describe('computeDiseaseRecurrenceRates', () => {
  it('marks multi-visit disease patients as returning within window', () => {
    const rates = computeDiseaseRecurrenceRates(sample, 90)
    expect(rates.get('무릎관절증')).toBeGreaterThan(0)
    expect(rates.get('고혈압') ?? 0).toBe(0)
  })
})
