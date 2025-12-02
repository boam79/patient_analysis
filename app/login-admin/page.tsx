'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
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

      // 사용자 프로필 조회하여 ADMIN 역할 확인
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
        // 로그아웃
        await supabase.auth.signOut()
        return
      }

      // 로그인 성공 - 제작자 대시보드로 리다이렉트
      window.location.href = '/admin'
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">제작자 로그인</CardTitle>
          <CardDescription>
            관리자 계정으로 로그인하여 제작자 페이지에 접근하세요
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
        </CardContent>
      </Card>
    </div>
  )
}

