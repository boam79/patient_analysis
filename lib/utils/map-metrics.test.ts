import { describe, expect, it } from 'vitest'
import type { PatientData } from '@/stores/data-store'
import { computeMapLayer, computeRegionPatientSplit } from './map-metrics'

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
    latitude: 37.5,
    longitude: 127.0,
    ...overrides,
  }
}

const baseMap = [
  {
    latitude: 37.5,
    longitude: 127.0,
    region: '서울 강남구',
    h3Index: 'h3_a',
  },
]

describe('computeMapLayer', () => {
  it('returns empty when rows empty (no sample fallback)', () => {
    expect(computeMapLayer([], baseMap, { metric: 'visits' })).toEqual([])
  })

  it('counts visits per region', () => {
    const rows = [
      makePatient(),
      makePatient({ patient_id: 'P2', visit_date: '2024-02-01' }),
    ]
    const layer = computeMapLayer(rows, baseMap, { metric: 'visits' })
    expect(layer).toHaveLength(1)
    expect(layer[0].value).toBe(2)
  })

  it('classifies new vs returning with window', () => {
    const rows = [
      makePatient({ patient_id: 'A', visit_date: '2024-01-01' }),
      makePatient({ patient_id: 'A', visit_date: '2024-01-20' }),
      makePatient({ patient_id: 'B', visit_date: '2024-01-01' }),
      makePatient({ patient_id: 'B', visit_date: '2024-08-01' }),
    ]
    const returning = computeMapLayer(rows, baseMap, {
      metric: 'returning',
      windowSize: 90,
    })
    const neu = computeMapLayer(rows, baseMap, { metric: 'new', windowSize: 90 })
    expect(returning[0].value).toBe(1)
    expect(neu[0].value).toBe(1)
  })

  it('matches surgery by code when name missing', () => {
    const rows = [
      makePatient({
        surgery_code: 'S80501',
        surgery_name: undefined,
      }),
    ]
    const layer = computeMapLayer(rows, baseMap, {
      metric: 'surgery',
      surgery: 'S80501',
    })
    expect(layer[0].value).toBe(1)
  })

  it('disease filter omits regions with zero matches', () => {
    const multiMap = [
      ...baseMap,
      {
        latitude: 37.48,
        longitude: 127.03,
        region: '서울 서초구',
        h3Index: 'h3_b',
      },
    ]
    const rows = [
      makePatient({ disease_name: '무릎관절증', region: '서울 강남구' }),
      makePatient({
        patient_id: 'P2',
        disease_name: '본태성 고혈압',
        region: '서울 서초구',
        latitude: 37.48,
        longitude: 127.03,
      }),
    ]
    const layer = computeMapLayer(rows, multiMap, {
      metric: 'disease',
      disease: '무릎관절증',
    })
    expect(layer).toHaveLength(1)
    expect(layer[0].region).toBe('서울 강남구')
    expect(layer[0].value).toBe(1)
  })

  it('surgery filter matches name or code list and drops empty regions', () => {
    const multiMap = [
      ...baseMap,
      {
        latitude: 37.48,
        longitude: 127.03,
        region: '서울 서초구',
        h3Index: 'h3_b',
      },
    ]
    const rows = [
      makePatient({
        surgery_name: '무릎관절경수술',
        region: '서울 강남구',
      }),
      makePatient({
        patient_id: 'P2',
        surgery_code: 'S999',
        surgery_name: undefined,
        region: '서울 서초구',
        latitude: 37.48,
        longitude: 127.03,
      }),
    ]
    const byName = computeMapLayer(rows, multiMap, {
      metric: 'surgery',
      surgery: ['무릎관절경수술'],
    })
    expect(byName).toHaveLength(1)
    expect(byName[0].region).toBe('서울 강남구')

    const byCode = computeMapLayer(rows, multiMap, {
      metric: 'surgery',
      surgery: 'S999',
    })
    expect(byCode).toHaveLength(1)
    expect(byCode[0].region).toBe('서울 서초구')
  })

  it('visits after disease-prefilter only shows matching regions', () => {
    const multiMap = [
      ...baseMap,
      {
        latitude: 37.48,
        longitude: 127.03,
        region: '서울 서초구',
        h3Index: 'h3_b',
      },
    ]
    const rows = [
      makePatient({ disease_name: '무릎관절증', region: '서울 강남구' }),
    ]
    const layer = computeMapLayer(rows, multiMap, { metric: 'visits' })
    expect(layer.map((p) => p.region)).toEqual(['서울 강남구'])
  })

  it('classifies new/returning per region, not globally', () => {
    const multiMap = [
      ...baseMap,
      {
        latitude: 37.48,
        longitude: 127.03,
        region: '서울 서초구',
        h3Index: 'h3_b',
      },
    ]
    // 같은 환자: 강남에서만 재방문, 서초는 1회
    const rows = [
      makePatient({
        patient_id: 'A',
        visit_date: '2024-01-01',
        region: '서울 강남구',
      }),
      makePatient({
        patient_id: 'A',
        visit_date: '2024-01-20',
        region: '서울 강남구',
      }),
      makePatient({
        patient_id: 'A',
        visit_date: '2024-02-01',
        region: '서울 서초구',
        latitude: 37.48,
        longitude: 127.03,
      }),
    ]
    const returning = computeMapLayer(rows, multiMap, {
      metric: 'returning',
      windowSize: 90,
    })
    const neu = computeMapLayer(rows, multiMap, {
      metric: 'new',
      windowSize: 90,
    })
    expect(returning.find((p) => p.region === '서울 강남구')?.value).toBe(1)
    expect(returning.find((p) => p.region === '서울 서초구')).toBeUndefined()
    expect(neu.find((p) => p.region === '서울 서초구')?.value).toBe(1)
    expect(neu.find((p) => p.region === '서울 강남구')).toBeUndefined()
  })
})

describe('computeRegionPatientSplit', () => {
  it('uses window retention', () => {
    const rows = [
      makePatient({ patient_id: 'A', visit_date: '2024-01-01' }),
      makePatient({ patient_id: 'A', visit_date: '2024-01-15' }),
      makePatient({ patient_id: 'B', visit_date: '2024-01-01' }),
    ]
    const split = computeRegionPatientSplit(rows, 90)
    expect(split.unique).toBe(2)
    expect(split.returningPatients).toBe(1)
    expect(split.newPatients).toBe(1)
  })
})
