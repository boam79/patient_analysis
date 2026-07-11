import { describe, expect, it } from 'vitest'
import {
  SAMPLE_PATIENT_DATA,
  SAMPLE_DISEASE_OPTIONS,
  SAMPLE_REGION_OPTIONS,
  getSampleMapPoints,
  resolveAnalysisData,
} from './sample-data'

describe('sample-data', () => {
  it('has patient rows with coords for all regions', () => {
    expect(SAMPLE_PATIENT_DATA.length).toBeGreaterThan(20)
    SAMPLE_PATIENT_DATA.forEach((p) => {
      expect(p.region).toBeTruthy()
      expect(p.latitude).toBeTypeOf('number')
      expect(p.longitude).toBeTypeOf('number')
    })
  })

  it('disease options include 본태성 고혈압 not bare 고혈압', () => {
    expect(SAMPLE_DISEASE_OPTIONS).toContain('본태성 고혈압')
    expect(SAMPLE_DISEASE_OPTIONS).not.toContain('고혈압')
  })

  it('region options match patient regions', () => {
    expect(SAMPLE_REGION_OPTIONS.length).toBeGreaterThan(5)
    expect(SAMPLE_REGION_OPTIONS).toContain('서울 강남구')
  })

  it('map points have positive visit values', () => {
    const points = getSampleMapPoints()
    expect(points.length).toBeGreaterThan(0)
    expect(points.every((p) => p.value > 0)).toBe(true)
  })

  it('resolveAnalysisData falls back to sample', () => {
    expect(resolveAnalysisData(false, [])).toHaveLength(SAMPLE_PATIENT_DATA.length)
    expect(resolveAnalysisData(true, [])).toHaveLength(SAMPLE_PATIENT_DATA.length)
    const real = [SAMPLE_PATIENT_DATA[0]]
    expect(resolveAnalysisData(true, real)).toEqual(real)
  })
})
