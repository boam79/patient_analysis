import { Header } from '@/components/layout/header'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="pb-20 lg:pb-6">{children}</main>
      <MobileBottomNav />
    </>
  )
}
