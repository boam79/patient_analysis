import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * 관리자 인증 및 권한 검증 헬퍼
 * 승인된(is_approved) ADMIN만 통과시킵니다.
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
    .select('role, is_approved')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw new Error(`프로필 조회 실패: ${profileError.message}`)
  }

  if (!profile || profile.role !== 'ADMIN' || profile.is_approved !== true) {
    throw new Error('승인된 관리자만 접근할 수 있습니다.')
  }

  return { userId: user.id, email: user.email ?? '' }
}

/**
 * Service Role 전용 Supabase Admin 클라이언트.
 * ANON_KEY 폴백 금지 — 키 없으면 즉시 throw.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다. 관리자 기능을 사용할 수 없습니다.'
    )
  }

  return createAdminClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
