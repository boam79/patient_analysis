/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 날짜 문자열을 안전하게 파싱
 * @param dateString - 날짜 문자열 (다양한 형식 지원) 또는 Date 객체
 * @returns Date 객체 또는 null
 */
export function parseDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null
  
  // 이미 Date 객체인 경우
  if (dateString instanceof Date) return dateString
  
  // 문자열인 경우 파싱 시도
  const date = new Date(dateString as string)
  
  // Invalid Date 체크
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}`)
    return null
  }
  
  return date
}

/**
 * 날짜를 YYYY-MM 형식으로 변환
 * @param date - Date 객체 또는 날짜 문자열
 * @returns YYYY-MM 형식 문자열
 */
export function formatMonth(date: Date | string | null): string {
  const dateObj = typeof date === 'string' ? parseDate(date) : date
  if (!dateObj) return ''
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 * @param date - Date 객체 또는 날짜 문자열
 * @returns YYYY-MM-DD 형식 문자열
 */
export function formatDate(date: Date | string | null): string {
  const dateObj = typeof date === 'string' ? parseDate(date) : date
  if (!dateObj) return ''
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 날짜 문자열에서 월 추출 (YYYY-MM 형식)
 * @param dateString - 날짜 문자열
 * @returns YYYY-MM 형식 문자열
 */
export function extractMonth(dateString: string): string {
  if (!dateString) return ''
  
  // YYYY-MM-DD 형식인 경우
  if (dateString.length >= 7 && dateString.includes('-')) {
    return dateString.substring(0, 7)
  }
  
  // YYYY/MM/DD 형식인 경우
  if (dateString.length >= 7 && dateString.includes('/')) {
    const parts = dateString.split('/')
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}`
    }
  }
  
  // 파싱 시도
  const date = parseDate(dateString)
  if (date) {
    return formatMonth(date)
  }
  
  return ''
}

