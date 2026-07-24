import { describe, expect, it } from 'vitest'
import { buildFilterChips } from '@/lib/utils/filter-chips'
import { buildDashboardInsight } from '@/lib/utils/dashboard-insight'

describe('buildFilterChips', () => {
  it('기본 윈도우·빈 필터면 칩 없음', () => {
    expect(
      buildFilterChips({
        dateRange: { start: '', end: '' },
        windowSize: 90,
        selectedDiseases: [],
        selectedSurgeries: [],
        selectedRegions: [],
        ageGroups: [],
        genders: ['남성', '여성'],
      })
    ).toEqual([])
  })

  it('활성 필터를 칩으로 변환', () => {
    const chips = buildFilterChips({
      dateRange: { start: '2024-01-01', end: '2024-12-31' },
      windowSize: 30,
      selectedDiseases: ['고혈압'],
      selectedSurgeries: [],
      selectedRegions: ['서울 강남구'],
      ageGroups: ['50대'],
      genders: ['여성'],
    })
    expect(chips.map((c) => c.kind)).toEqual([
      'date',
      'window',
      'disease',
      'region',
      'age',
      'gender',
    ])
    expect(chips.find((c) => c.kind === 'window')?.label).toBe('윈도우 30일')
  })
})

describe('buildDashboardInsight', () => {
  it('빈 필터 결과', () => {
    const insight = buildDashboardInsight({
      recurrenceRate: 0,
      totalPatients: 0,
      avgInterval: 0,
      emptyFilter: true,
    })
    expect(insight.headline).toContain('필터')
  })

  it('지역·질병이 있으면 견인 문구', () => {
    const insight = buildDashboardInsight({
      recurrenceRate: 42.3,
      totalPatients: 3200,
      avgInterval: 28,
      topRegion: '서울 강남구',
      topDisease: '무릎관절증',
    })
    expect(insight.headline).toContain('42.3%')
    expect(insight.headline).toContain('서울 강남구')
    expect(insight.headline).toContain('무릎관절증')
  })
})
