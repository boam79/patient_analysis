'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('로그인에 실패했습니다.')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, is_approved')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        setError('사용자 프로필을 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      if (!profile.is_approved) {
        setError('승인 대기 중인 계정입니다. 관리자 승인을 기다려주세요.')
        setLoading(false)
        return
      }

      if (profile.role !== 'ADMIN') {
        setError('제작자 페이지는 관리자만 접근할 수 있습니다.')
        setLoading(false)
        await supabase.auth.signOut()
        return
      }

      window.location.href = '/admin'
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center animate-fade-up">
          <Link href="/" className="font-display text-3xl font-bold text-brand">
            병원 CRM
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">제작자 로그인</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="animate-fade-up-delay space-y-4 rounded-xl border border-border bg-card/80 p-6 backdrop-blur-sm"
        >
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  )
}
