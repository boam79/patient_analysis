import { redirect } from 'next/navigation'

export default function Home() {
  // 인증 없이 바로 대시보드로 리다이렉트 (개발/테스트용)
  redirect('/dashboard')
}
