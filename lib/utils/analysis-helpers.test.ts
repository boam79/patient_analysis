import { describe, expect, it } from 'vitest'
import type { PatientData } from '@/stores/data-store'
import {
  hasSurgery,
  calculateQuartiles,
  hasActiveFilters,
  buildRegionVisitMap,
} from '@/lib/utils/analysis-helpers'

describe('hasSurgery', () => {
  it('accepts code or name', () => {
    expect(hasSurgery({ surgery_code: 'S1', surgery_name: undefined })).toBe(true)
    expect(hasSurgery({ surgery_code: undefined, surgery_name: '무릎' })).toBe(true)
    expect(hasSurgery({ surgery_code: '', surgery_name: '  ' })).toBe(false)
  })
})

describe('calculateQuartiles', () => {
  it('uses linear interpolation', () => {
    const q = calculateQuartiles([1, 2, 3, 4, 5])
    expect(q.min).toBe(1)
    expect(q.max).toBe(5)
    expect(q.median).toBe(3)
    expect(q.q1).toBe(2)
    expect(q.q3).toBe(4)
  })
})

describe('hasActiveFilters', () => {
  it('treats empty date as inactive', () => {
    expect(
      hasActiveFilters({
        selectedDiseases: [],
        selectedSurgeries: [],
        selectedRegions: [],
        ageGroups: [],
        genders: ['남성', '여성'],
        dateRange: { start: '', end: '' },
        windowSize: 90,
        defaultWindowSize: 90,
      })
    ).toBe(false)
  })

  it('treats set date range as active', () => {
    expect(
      hasActiveFilters({
        selectedDiseases: [],
        selectedSurgeries: [],
        selectedRegions: [],
        ageGroups: [],
        genders: ['남성', '여성'],
        dateRange: { start: '2024-01-01', end: '2024-06-01' },
      })
    ).toBe(true)
  })
})

describe('buildRegionVisitMap', () => {
  it('backfills coords from later rows or base map', () => {
    const rows = [
      {
        patient_id: '1',
        name: 'A',
        visit_date: '2024-01-01',
        age: 40,
        gender: '남성',
        disease_code: 'M',
        disease_name: '무릎',
        address: 'x',
        region: '서울 강남구',
      },
      {
        patient_id: '2',
        name: 'B',
        visit_date: '2024-01-02',
        age: 40,
        gender: '여성',
        disease_code: 'M',
        disease_name: '무릎',
        address: 'y',
        region: '서울 강남구',
        latitude: 37.5,
        longitude: 127.0,
      },
    ] as PatientData[]

    const points = buildRegionVisitMap(rows)
    expect(points).toHaveLength(1)
    expect(points[0].value).toBe(2)
    expect(points[0].latitude).toBe(37.5)
  })
})
