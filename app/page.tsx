import { redirect } from 'next/navigation'

export default function Home() {
  // 초기 화면을 업로드 페이지로 리다이렉트
  redirect('/dashboard/upload')
}
