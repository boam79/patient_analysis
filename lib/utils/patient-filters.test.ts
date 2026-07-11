import { describe, it, expect } from 'vitest'
import { filterPatients, type PatientFilterOptions } from './patient-filters'
import type { PatientData } from '@/stores/data-store'

function makePatient(overrides: Partial<PatientData> = {}): PatientData {
  return {
    patient_id: 'P1',
    name: '홍길동',
    visit_date: '2024-06-15',
    age: 35,
    gender: 'M',
    disease_code: 'D001',
    disease_name: '고혈압',
    surgery_name: undefined,
    address: '서울특별시 강남구',
    region: '서울특별시 강남구',
    ...overrides,
  }
}

const noFilters: PatientFilterOptions = {
  selectedDiseases: [],
  selectedRegions: [],
  selectedSurgeries: [],
  ageGroups: [],
  genders: [],
  dateRange: { start: null, end: null },
}

describe('filterPatients', () => {
  it('데이터가 비어있으면 빈 배열을 반환한다', () => {
    expect(filterPatients([], noFilters)).toEqual([])
  })

  it('필터가 없으면 모든 데이터를 그대로 반환한다', () => {
    const data = [makePatient(), makePatient({ patient_id: 'P2' })]
    expect(filterPatients(data, noFilters)).toHaveLength(2)
  })

  it('질병 필터가 적용된다', () => {
    const data = [
      makePatient({ disease_name: '고혈압' }),
      makePatient({ disease_name: '당뇨' }),
    ]
    const result = filterPatients(data, { ...noFilters, selectedDiseases: ['고혈압'] })
    expect(result).toHaveLength(1)
    expect(result[0].disease_name).toBe('고혈압')
  })

  it('지역 필터가 적용된다', () => {
    const data = [
      makePatient({ region: '서울특별시 강남구' }),
      makePatient({ region: '부산광역시 해운대구' }),
    ]
    const result = filterPatients(data, { ...noFilters, selectedRegions: ['부산광역시 해운대구'] })
    expect(result).toHaveLength(1)
    expect(result[0].region).toBe('부산광역시 해운대구')
  })

  it('수술 필터: 수술코드만 있어도 매칭된다', () => {
    const data = [
      makePatient({ surgery_code: 'S80501', surgery_name: undefined }),
      makePatient({ surgery_name: undefined, surgery_code: undefined }),
    ]
    const result = filterPatients(data, {
      ...noFilters,
      selectedSurgeries: ['S80501'],
    })
    expect(result).toHaveLength(1)
    expect(result[0].surgery_code).toBe('S80501')
  })

  it('수술 필터 적용 시 수술 기록이 없는 환자는 제외된다', () => {
    const data = [
      makePatient({ surgery_name: '척추 유합술' }),
      makePatient({ surgery_name: undefined }),
    ]
    const result = filterPatients(data, { ...noFilters, selectedSurgeries: ['척추 유합술'] })
    expect(result).toHaveLength(1)
    expect(result[0].surgery_name).toBe('척추 유합술')
  })

  it('연령대 필터가 적용된다 (20대만 선택)', () => {
    const data = [
      makePatient({ age: 25 }),
      makePatient({ age: 45 }),
    ]
    const result = filterPatients(data, { ...noFilters, ageGroups: ['20대'] })
    expect(result).toHaveLength(1)
    expect(result[0].age).toBe(25)
  })

  it('성별 필터: 하나만 선택하면 해당 성별만 남는다', () => {
    const data = [
      makePatient({ gender: 'M' }),
      makePatient({ gender: 'F' }),
    ]
    const result = filterPatients(data, { ...noFilters, genders: ['남성'] })
    expect(result).toHaveLength(1)
    expect(result[0].gender).toBe('M')
  })

  it('성별 필터: 두 성별을 모두 선택하면 필터링하지 않는다', () => {
    const data = [
      makePatient({ gender: 'M' }),
      makePatient({ gender: 'F' }),
    ]
    const result = filterPatients(data, { ...noFilters, genders: ['남성', '여성'] })
    expect(result).toHaveLength(2)
  })

  it('날짜 범위 필터가 적용된다', () => {
    const data = [
      makePatient({ visit_date: '2024-01-01' }),
      makePatient({ visit_date: '2024-06-15' }),
      makePatient({ visit_date: '2024-12-31' }),
    ]
    const result = filterPatients(data, {
      ...noFilters,
      dateRange: { start: '2024-05-01', end: '2024-07-01' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].visit_date).toBe('2024-06-15')
  })

  it('여러 필터를 동시에 적용하면 모두 만족하는 데이터만 반환한다 (AND 조건)', () => {
    const data = [
      makePatient({ disease_name: '고혈압', region: '서울특별시 강남구', age: 35 }),
      makePatient({ disease_name: '고혈압', region: '부산광역시 해운대구', age: 35 }),
      makePatient({ disease_name: '당뇨', region: '서울특별시 강남구', age: 35 }),
    ]
    const result = filterPatients(data, {
      ...noFilters,
      selectedDiseases: ['고혈압'],
      selectedRegions: ['서울특별시 강남구'],
    })
    expect(result).toHaveLength(1)
    expect(result[0].disease_name).toBe('고혈압')
    expect(result[0].region).toBe('서울특별시 강남구')
  })
})
