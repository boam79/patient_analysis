import { createClient } from '@/lib/supabase/server'

/**
 * 관리자 인증 및 권한 검증 헬퍼
 * ADMIN 역할을 가진 인증된 사용자만 통과시킵니다.
 * 인증 실패 또는 권한 없음 시 Error를 throw합니다.
 */
export async function requireAdminAuth(): Promise<{ userId: string; email: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다. 관리자 기능을 사용할 수 없습니다.'
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(`인증 오류: ${authError.message}`)
  }

  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw new Error(`프로필 조회 실패: ${profileError.message}`)
  }

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 접근할 수 있습니다.')
  }

  return { userId: user.id, email: user.email ?? '' }
}
