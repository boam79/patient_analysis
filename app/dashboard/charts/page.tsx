import { redirect } from 'next/navigation'

/**
 * 차트 전용 페이지는 대시보드로 흡수됨 (v5.1).
 * 북마크 호환을 위해 리다이렉트만 유지.
 */
export default function ChartsPage() {
  redirect('/dashboard')
}
