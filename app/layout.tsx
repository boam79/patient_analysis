import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: '환자 데이터 분석툴 v4.1',
  description: '환자 데이터 분석 대시보드 - Patient Data Review',
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

