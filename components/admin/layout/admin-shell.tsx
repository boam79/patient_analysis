'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/layout/admin-sidebar'
import { AdminHeader } from '@/components/admin/layout/admin-header'
import { Toaster } from 'sonner'

interface AdminShellProps {
  user: {
    name: string | null
    email: string
  }
  children: React.ReactNode
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          user={user}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
