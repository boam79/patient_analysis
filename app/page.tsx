import { redirect } from 'next/navigation'

export default function Home() {
  // 초기 화면을 업로드 페이지로 리다이렉트
  // 아직 로그인 기능을 구현하지 않으므로 공개 접근 가능
  redirect('/dashboard/upload')
}
