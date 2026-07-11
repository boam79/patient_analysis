import { PatientData } from '@/stores/data-store'
import { normalizeGender, getAgeGroup } from '@/lib/utils/patient-helpers'
import { parseDate } from '@/lib/utils/date-helpers'

export interface PatientFilterOptions {
  selectedDiseases: string[]
  selectedRegions: string[]
  selectedSurgeries: string[]
  ageGroups: string[]
  genders: ('남성' | '여성')[]
  dateRange: {
    start: string | null
    end: string | null
  }
}

/**
 * 공통 환자 필터링 유틸리티
 * 대시보드/전략 페이지 등에서 재사용하여 중복 연산을 줄인다.
 */
export function filterPatients(
  data: PatientData[],
  {
    selectedDiseases,
    selectedRegions,
    selectedSurgeries,
    ageGroups,
    genders,
    dateRange,
  }: PatientFilterOptions
): PatientData[] {
  if (!data || data.length === 0) return []

  return data.filter((patient) => {
    // 질병 필터
    if (selectedDiseases.length > 0 && !selectedDiseases.includes(patient.disease_name)) {
      return false
    }

    // 지역 필터
    if (selectedRegions.length > 0 && !selectedRegions.includes(patient.region)) {
      return false
    }

    // 수술 필터 (수술명 또는 수술코드 매칭)
    if (selectedSurgeries.length > 0) {
      const surgeryName = patient.surgery_name?.toString().trim()
      const surgeryCode = patient.surgery_code?.toString().trim()
      const matched =
        (surgeryName && selectedSurgeries.includes(surgeryName)) ||
        (surgeryCode && selectedSurgeries.includes(surgeryCode))
      if (!matched) {
        return false
      }
    }

    // 연령대 필터
    if (ageGroups.length > 0) {
      const ageGroup = getAgeGroup(patient.age)
      if (!ageGroups.includes(ageGroup)) {
        return false
      }
    }

    // 성별 필터 (두 성별이 모두 선택된 경우는 필터링하지 않음)
    if (genders.length > 0 && genders.length < 2) {
      const patientGender = normalizeGender(patient.gender)
      if (!genders.includes(patientGender as '남성' | '여성')) {
        return false
      }
    }

    // 날짜 필터
    if (dateRange.start && dateRange.end) {
      const visitDate = parseDate(patient.visit_date)
      const startDate = parseDate(dateRange.start)
      const endDate = parseDate(dateRange.end)

      if (!visitDate || !startDate || !endDate) return false
      const visitTime = visitDate.getTime()
      const startTime = startDate.getTime()
      const endTime = endDate.getTime()

      if (isNaN(visitTime) || isNaN(startTime) || isNaN(endTime)) return false
      if (visitTime < startTime || visitTime > endTime) return false
    }

    return true
  })
}


