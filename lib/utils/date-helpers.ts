/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * YYYY-MM-DD / YYYY/MM/DD 를 로컬 noon Date로 파싱 (UTC 자정 밀림 방지)
 */
function parseCalendarDateLocal(dateString: string): Date | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim())
  if (iso) {
    const y = Number(iso[1])
    const m = Number(iso[2])
    const d = Number(iso[3])
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return new Date(y, m - 1, d, 12, 0, 0, 0)
    }
  }
  const slash = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(dateString.trim())
  if (slash) {
    const y = Number(slash[1])
    const m = Number(slash[2])
    const d = Number(slash[3])
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return new Date(y, m - 1, d, 12, 0, 0, 0)
    }
  }
  return null
}

/**
 * 날짜 문자열을 안전하게 파싱
 * @param dateString - 날짜 문자열 (다양한 형식 지원) 또는 Date 객체
 * @returns Date 객체 또는 null
 */
export function parseDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null

  if (dateString instanceof Date) return dateString

  const local = parseCalendarDateLocal(dateString as string)
  if (local) return local

  const date = new Date(dateString as string)

  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}`)
    return null
  }

  return date
}

/**
 * 날짜를 YYYY-MM 형식으로 변환
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
 * 날짜 문자열에서 월 추출 (YYYY-MM) — 문자열 슬라이스 우선으로 타임존 영향 없음
 */
export function extractMonth(dateString: string): string {
  if (!dateString) return ''

  if (dateString.length >= 7 && dateString.includes('-')) {
    return dateString.substring(0, 7)
  }

  if (dateString.length >= 7 && dateString.includes('/')) {
    const parts = dateString.split('/')
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}`
    }
  }

  const date = parseDate(dateString)
  if (date) {
    return formatMonth(date)
  }

  return ''
}
