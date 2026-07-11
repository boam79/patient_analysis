import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: '병원 CRM',
  description: '방문 데이터로 재방문·지역·전략을 한눈에 — 병원 CRM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/sun-typeface/SUITE@2/fonts/variable/woff2/SUITE-Variable.css"
        />
      </head>
      <body className="flex flex-col min-h-screen font-body">
        <div className="flex-1">{children}</div>
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}
