import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: '병원 CRM v4.5',
  description: '병원 CRM — 환자 방문 데이터 분석 및 전략 인사이트',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="flex flex-col min-h-screen">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}

