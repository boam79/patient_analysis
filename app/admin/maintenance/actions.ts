'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/audit'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * 데이터베이스 테이블 통계 조회
 */
export async function getDatabaseStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 접근할 수 있습니다.')
  }

  // 각 테이블의 행 수 조회
  const tables = [
    'user_profiles',
    'user_sessions',
    'audit_logs',
    'ip_access_logs',
    'settings',
    'permissions',
    'user_permissions',
  ]

  const tableStats = await Promise.all(
    tables.map(async (table) => {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true })

      return {
        name: table,
        rowCount: count || 0,
        error: error?.message,
      }
    })
  )

  return tableStats
}

/**
 * 인덱스 정보 조회
 */
export async function getIndexInfo() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 접근할 수 있습니다.')
  }

  // 인덱스 정보는 SQL로 직접 조회
  const { data, error } = await supabaseAdmin.rpc('exec_sql', {
    query: `
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `,
  })

  if (error) {
    // RPC가 없으면 직접 쿼리 (제한적)
    return []
  }

  return data || []
}

/**
 * 시스템 설정 조회
 */
export async function getSystemSettings() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 접근할 수 있습니다.')
  }

  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .order('key')

  if (error) {
    throw new Error(`시스템 설정 조회 실패: ${error.message}`)
  }

  return data || []
}

/**
 * 시스템 설정 업데이트
 */
export async function updateSystemSetting(key: string, value: string, description?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 접근할 수 있습니다.')
  }

  const { data: existing } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('key', key)
    .single()

  if (existing) {
    // 업데이트
    const { error } = await supabaseAdmin
      .from('settings')
      .update({
        value,
        description: description || existing.description,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('key', key)

    if (error) {
      throw new Error(`설정 업데이트 실패: ${error.message}`)
    }
  } else {
    // 생성
    const { error } = await supabaseAdmin
      .from('settings')
      .insert({
        key,
        value,
        description: description || null,
        updated_by: user.id,
      })

    if (error) {
      throw new Error(`설정 생성 실패: ${error.message}`)
    }
  }

  await logAction({
    userId: user.id,
    action: 'settings.update',
    resource: 'settings',
    details: {
      key,
      old_value: existing?.value,
      new_value: value,
    },
  })

  revalidatePath('/admin/maintenance')
}

/**
 * 유지보수 모드 토글
 */
export async function toggleMaintenanceMode(enabled: boolean) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 접근할 수 있습니다.')
  }

  await updateSystemSetting(
    'maintenance.enabled',
    enabled ? 'true' : 'false',
    '시스템 유지보수 모드 활성화 여부'
  )

  await logAction({
    userId: user.id,
    action: 'maintenance.toggle',
    resource: 'system',
    details: {
      enabled,
    },
  })

  return { success: true }
}

/**
 * 데이터베이스 연결 상태 확인
 */
export async function checkDatabaseHealth() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 접근할 수 있습니다.')
  }

  try {
    // 간단한 쿼리로 연결 확인
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (error) {
      return {
        status: 'error',
        message: error.message,
      }
    }

    return {
      status: 'healthy',
      message: '데이터베이스 연결 정상',
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || '데이터베이스 연결 실패',
    }
  }
}

