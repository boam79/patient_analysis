'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'

/**
 * 일반 사용자 로그인 페이지
 * 
 * 주의: 현재는 기능만 구현되어 있으며, 실제 사용은 나중에 활성화 예정입니다.
 * 활성화하려면 middleware.ts에서 /login 경로를 활성화하세요.
 */
export default function LoginPage() {
  const router = useRouter()
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
      
      // 로그인
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

      // 사용자 프로필 조회하여 승인 상태 확인
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

      // ADMIN은 제작자 페이지로 리다이렉트
      if (profile.role === 'ADMIN') {
        window.location.href = '/admin'
        return
      }

      // 승인되지 않은 사용자
      if (!profile.is_approved) {
        setError('승인 대기 중인 계정입니다. 관리자 승인을 기다려주세요.')
        setLoading(false)
        // 로그아웃
        await supabase.auth.signOut()
        return
      }

      // 로그인 성공 - 대시보드로 리다이렉트
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
          <CardDescription className="text-center">
            병원 CRM에 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
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
                placeholder="••••••••"
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

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>관리자 계정으로 로그인하려면</p>
            <a href="/login-admin" className="text-primary hover:underline">
              제작자 페이지 로그인
            </a>
            으로 이동하세요.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

