import { describe, expect, it } from 'vitest'
import type { PatientData } from '@/stores/data-store'
import {
  buildManagementInsights,
  estimateObservationMonths,
  looksMusculoskeletal,
} from './management-insights'
import { SAMPLE_PATIENT_DATA } from '@/lib/sample-data'

function p(overrides: Partial<PatientData> = {}): PatientData {
  return {
    patient_id: 'P1',
    name: '홍',
    visit_date: '2024-01-01',
    age: 50,
    gender: '남성',
    disease_code: 'M25.5',
    disease_name: '무릎관절증',
    address: '서울',
    region: '서울 강남구',
    ...overrides,
  }
}

describe('management-insights accuracy', () => {
  it('estimates observation months from span', () => {
    const months = estimateObservationMonths([
      p({ visit_date: '2024-01-01' }),
      p({ visit_date: '2024-07-01', patient_id: 'P2' }),
    ])
    expect(months).toBeGreaterThan(5)
    expect(months).toBeLessThan(8)
  })

  it('classifies musculoskeletal by code/name', () => {
    expect(looksMusculoskeletal(p())).toBe(true)
    expect(
      looksMusculoskeletal(
        p({ disease_code: 'I10', disease_name: '본태성 고혈압' })
      )
    ).toBe(false)
  })

  it('does not claim HIRA visit-share surgery ratio or fake notice in basis', () => {
    const insights = buildManagementInsights(SAMPLE_PATIENT_DATA, 90)
    const text = insights.map((i) => i.statisticalBasis + i.description).join('\n')
    expect(text).not.toMatch(/HIRA 권고 적정 수술 비중/)
    expect(text).not.toMatch(/제2023-179호/)
    expect(text).not.toMatch(/COC 권고 0\.82/)
    expect(text).not.toMatch(/%\/월.*통계청/)
    expect(text).toMatch(/전문병원의 지정 및 평가 등에 관한 규칙/)
  })

  it('labels retention with window size and operational evidence', () => {
    const insights = buildManagementInsights(SAMPLE_PATIENT_DATA, 90)
    const ret = insights.find((i) => i.id.startsWith('retention'))
    expect(ret).toBeTruthy()
    expect(ret!.title).toContain('90일')
    expect(ret!.evidenceLevel).toBe('operational')
    expect(ret!.statisticalBasis).toMatch(/운영/)
  })

  it('annualizes visits instead of comparing raw avg to invented annual mean', () => {
    const short = [
      p({ patient_id: 'A', visit_date: '2024-01-01' }),
      p({ patient_id: 'A', visit_date: '2024-01-20' }),
      p({ patient_id: 'B', visit_date: '2024-01-05' }),
    ]
    const insights = buildManagementInsights(short, 90)
    const visitInsight = insights.find((i) => i.id.startsWith('avg-visits'))
    if (visitInsight) {
      expect(visitInsight.description).toMatch(/연환산/)
      expect(visitInsight.statisticalBasis).not.toMatch(/기대 연간 방문 8\.4/)
    }
  })

  it('growth basis does not present MoM thresholds as Statistics Korea monthly demand', () => {
    const rows: PatientData[] = []
    for (let i = 0; i < 10; i++) {
      rows.push(
        p({
          patient_id: `M1-${i}`,
          visit_date: '2024-01-10',
        })
      )
    }
    for (let i = 0; i < 3; i++) {
      rows.push(
        p({
          patient_id: `M2-${i}`,
          visit_date: '2024-02-10',
        })
      )
    }
    const insights = buildManagementInsights(rows, 90)
    const growth = insights.find((i) => i.id.startsWith('growth'))
    expect(growth).toBeTruthy()
    expect(growth!.statisticalBasis).toMatch(/MoM/)
    expect(growth!.statisticalBasis).not.toMatch(/정상 성장 범위 \+3~?\+?8%\/월/)
  })
})
