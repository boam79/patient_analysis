/**
 * PostgREST `.or()` / `.ilike` 필터에 넣을 검색어 sanitize.
 * `,` `()` `.` 등은 필터 파싱을 깨뜨리므로 제거합니다.
 */
export function sanitizeSearchTerm(raw: string, maxLen = 80): string {
  return raw
    .trim()
    .slice(0, maxLen)
    .replace(/[%_,.()\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 관리자 비밀번호 정책 */
export function validateAdminPassword(password: string): string | null {
  if (password.length < 10) {
    return '비밀번호는 10자 이상이어야 합니다.'
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.'
  }
  return null
}
