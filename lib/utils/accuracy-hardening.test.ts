import { describe, expect, it } from 'vitest'
import { extractMonth, parseDate } from '@/lib/utils/date-helpers'
import { computeDiseaseRecurrenceStats } from '@/lib/utils/monthly-trend'
import { buildDashboardInsight } from '@/lib/utils/dashboard-insight'
import type { PatientData } from '@/stores/data-store'
import { SAMPLE_PATIENT_DATA } from '@/lib/sample-data'
import { computeRetentionSummary } from '@/lib/utils/strategy-metrics'

describe('parseDate local calendar', () => {
  it('parses YYYY-MM-DD as local noon (no UTC day shift)', () => {
    const d = parseDate('2024-01-01')
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2024)
    expect(d!.getMonth()).toBe(0)
    expect(d!.getDate()).toBe(1)
  })

  it('extractMonth uses string slice', () => {
    expect(extractMonth('2024-12-31')).toBe('2024-12')
  })
})

describe('computeDiseaseRecurrenceStats', () => {
  it('keeps rate and counts on the same patient set', () => {
    const rows: PatientData[] = [
      {
        patient_id: 'a',
        name: 'A',
        visit_date: '2024-01-01',
        age: 40,
        gender: '남성',
        disease_code: 'M',
        disease_name: '무릎관절증',
        address: 'x',
        region: '서울 강남구',
      },
      {
        patient_id: 'a',
        name: 'A',
        visit_date: '2024-01-20',
        age: 40,
        gender: '남성',
        disease_code: 'M',
        disease_name: '무릎관절증',
        address: 'x',
        region: '서울 강남구',
      },
      {
        patient_id: 'b',
        name: 'B',
        visit_date: '2024-02-01',
        age: 50,
        gender: '여성',
        disease_code: 'M',
        disease_name: '무릎관절증',
        address: 'y',
        region: '서울 서초구',
      },
    ]
    const stats = computeDiseaseRecurrenceStats(rows, 90)
    const knee = stats.find((s) => s.disease === '무릎관절증')
    expect(knee).toBeTruthy()
    expect(knee!.total).toBe(2)
    expect(knee!.returning).toBe(1)
    expect(knee!.rate).toBe(50)
  })
})

describe('buildDashboardInsight window label', () => {
  it('includes window size in headline', () => {
    const insight = buildDashboardInsight({
      recurrenceRate: 40,
      totalPatients: 100,
      avgInterval: 20,
      windowSize: 90,
      topRegion: '서울 강남구',
    })
    expect(insight.headline).toContain('90일')
  })

  it('mentions sample bias when usingSample', () => {
    const insight = buildDashboardInsight({
      recurrenceRate: 40,
      totalPatients: 100,
      avgInterval: 20,
      usingSample: true,
    })
    expect(insight.detail).toMatch(/14–120|14-120/)
  })
})

describe('sample retention snapshot', () => {
  it('90-day window retention is finite and in 0–100 for sample', () => {
    const s = computeRetentionSummary(SAMPLE_PATIENT_DATA, 90)
    expect(s.uniquePatients).toBeGreaterThan(0)
    expect(s.retentionRate).toBeGreaterThanOrEqual(0)
    expect(s.retentionRate).toBeLessThanOrEqual(100)
  })

  it('30-day retention is not higher than 90-day on sample generator bias', () => {
    const r30 = computeRetentionSummary(SAMPLE_PATIENT_DATA, 30)
    const r90 = computeRetentionSummary(SAMPLE_PATIENT_DATA, 90)
    expect(r30.retentionRate).toBeLessThanOrEqual(r90.retentionRate + 0.01)
  })
})
