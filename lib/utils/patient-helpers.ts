/**
 * 병원 CRM — 방문·환자 식별 관련 유틸리티 함수
 */

/**
 * 연령대 계산
 * @param age - 나이
 * @returns 연령대 문자열
 */
export function getAgeGroup(age: number | null | undefined): string {
  if (age === null || age === undefined || isNaN(age)) return '미상'
  if (age < 20) return '10대 이하'
  if (age < 30) return '20대'
  if (age < 40) return '30대'
  if (age < 50) return '40대'
  if (age < 60) return '50대'
  if (age < 70) return '60대'
  return '70대 이상'
}

/**
 * 성별 정규화
 * @param gender - 성별 문자열 (다양한 형식 지원)
 * @returns 정규화된 성별 ('남성' 또는 '여성')
 */
export function normalizeGender(gender: string | null | undefined): '남성' | '여성' | '미상' {
  if (!gender) return '미상'
  
  const normalized = gender.toString().trim().toUpperCase()
  
  if (normalized === 'M' || normalized === '남' || normalized === '남성' || normalized === 'MALE') {
    return '남성'
  }
  
  if (normalized === 'F' || normalized === '여' || normalized === '여성' || normalized === 'FEMALE') {
    return '여성'
  }
  
  return '미상'
}

/**
 * 안전한 숫자 변환
 * @param value - 변환할 값
 * @param defaultValue - 기본값
 * @returns 숫자 또는 기본값
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * 안전한 문자열 변환
 * @param value - 변환할 값
 * @param defaultValue - 기본값
 * @returns 문자열 또는 기본값
 */
export function safeString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue
  return String(value).trim() || defaultValue
}

