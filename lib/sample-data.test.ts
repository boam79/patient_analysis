import { describe, expect, it } from 'vitest'
import {
  SAMPLE_PATIENT_DATA,
  SAMPLE_DISEASE_OPTIONS,
  SAMPLE_REGION_OPTIONS,
  SAMPLE_SURGERY_OPTIONS,
  SAMPLE_RECORD_COUNT,
  getSampleMapPoints,
  resolveAnalysisData,
} from './sample-data'
import { generateSamplePatientData } from './sample-data-generator'

describe('sample-data', () => {
  it('has exactly 10,000 visit rows with coords, gender, age, disease, region', () => {
    expect(SAMPLE_PATIENT_DATA).toHaveLength(SAMPLE_RECORD_COUNT)
    expect(SAMPLE_RECORD_COUNT).toBe(10_000)

    SAMPLE_PATIENT_DATA.forEach((p) => {
      expect(p.patient_id).toBeTruthy()
      expect(p.region).toBeTruthy()
      expect(p.latitude).toBeTypeOf('number')
      expect(p.longitude).toBeTypeOf('number')
      expect(['남성', '여성']).toContain(p.gender)
      expect(p.age).toBeGreaterThanOrEqual(18)
      expect(p.age).toBeLessThanOrEqual(90)
      expect(p.disease_name).toBeTruthy()
      expect(p.visit_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('covers region, disease, surgery dimensions', () => {
    expect(SAMPLE_DISEASE_OPTIONS).toContain('본태성 고혈압')
    expect(SAMPLE_DISEASE_OPTIONS).not.toContain('고혈압')
    expect(SAMPLE_DISEASE_OPTIONS.length).toBeGreaterThanOrEqual(10)
    expect(SAMPLE_REGION_OPTIONS.length).toBeGreaterThanOrEqual(20)
    expect(SAMPLE_REGION_OPTIONS).toContain('서울 강남구')
    expect(SAMPLE_SURGERY_OPTIONS.length).toBeGreaterThanOrEqual(5)
  })

  it('includes returning patients and surgery visits', () => {
    const byId = new Map<string, number>()
    SAMPLE_PATIENT_DATA.forEach((p) => {
      byId.set(p.patient_id, (byId.get(p.patient_id) || 0) + 1)
    })
    const returning = [...byId.values()].filter((n) => n > 1).length
    expect(returning).toBeGreaterThan(500)

    const withSurgery = SAMPLE_PATIENT_DATA.filter(
      (p) => p.surgery_name || p.surgery_code
    ).length
    expect(withSurgery).toBeGreaterThan(500)
  })

  it('is deterministic for the same seed', () => {
    const a = generateSamplePatientData({ count: 100, seed: 99 })
    const b = generateSamplePatientData({ count: 100, seed: 99 })
    expect(a).toEqual(b)
  })

  it('map points have positive visit values across many regions', () => {
    const points = getSampleMapPoints()
    expect(points.length).toBeGreaterThanOrEqual(20)
    expect(points.every((p) => p.value > 0)).toBe(true)
  })

  it('resolveAnalysisData falls back to sample', () => {
    expect(resolveAnalysisData(false, [])).toHaveLength(SAMPLE_RECORD_COUNT)
    expect(resolveAnalysisData(true, [])).toHaveLength(SAMPLE_RECORD_COUNT)
    const real = [SAMPLE_PATIENT_DATA[0]]
    expect(resolveAnalysisData(true, real)).toEqual(real)
  })
})
