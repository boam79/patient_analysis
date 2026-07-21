'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAction } from '@/lib/audit'
import { requireAdminAuth, getSupabaseAdmin } from '@/lib/admin-auth'

const settingValueSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9._-]+$/, '설정 키는 영문·숫자·._- 만 허용합니다.'),
  value: z.string().max(4000),
  description: z.string().max(500).optional(),
})

/**
 * 데이터베이스 테이블 통계 조회
 */
export async function getDatabaseStats() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const tables = [
    'user_profiles',
    'user_sessions',
    'audit_logs',
    'ip_access_logs',
    'settings',
    'permissions',
    'user_permissions',
    'error_logs',
    'system_alerts',
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
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

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
    return []
  }

  return data || []
}

/**
 * 시스템 설정 조회
 */
export async function getSystemSettings() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

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
 * 시스템 설정 업데이트 (Zod 검증)
 */
export async function updateSystemSetting(
  key: string,
  value: string,
  description?: string
) {
  const { userId } = await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const parsed = settingValueSchema.safeParse({ key, value, description })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || '설정 값이 올바르지 않습니다.')
  }

  const { data: existing } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('key', key)
    .single()

  if (existing) {
    const { error } = await supabaseAdmin
      .from('settings')
      .update({
        value,
        description: description || existing.description,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('key', key)

    if (error) {
      throw new Error(`설정 업데이트 실패: ${error.message}`)
    }
  } else {
    const { error } = await supabaseAdmin.from('settings').insert({
      key,
      value,
      description: description || null,
      updated_by: userId,
    })

    if (error) {
      throw new Error(`설정 생성 실패: ${error.message}`)
    }
  }

  await logAction({
    userId,
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
  const { userId } = await requireAdminAuth()

  await updateSystemSetting(
    'maintenance.enabled',
    enabled ? 'true' : 'false',
    '시스템 유지보수 모드 활성화 여부'
  )

  await logAction({
    userId,
    action: 'maintenance.toggle',
    resource: 'system',
    details: { enabled },
  })

  return { success: true }
}

/**
 * 데이터베이스 연결 상태 확인
 */
export async function checkDatabaseHealth() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .limit(1)

    if (error) {
      return {
        status: 'error' as const,
        message: error.message,
      }
    }

    return {
      status: 'healthy' as const,
      message: '데이터베이스 연결 정상',
    }
  } catch (error: unknown) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : '데이터베이스 연결 실패',
    }
  }
}

/**
 * 모니터링용 슬림 헬스 요약 (실데이터만)
 */
export async function getMonitoringHealth() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [dbHealth, errors24h, alerts24h, ipToday] = await Promise.all([
    (async () => {
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .limit(1)
      return error
        ? { status: 'error' as const, message: error.message }
        : { status: 'healthy' as const, message: '데이터베이스 연결 정상' }
    })(),
    supabaseAdmin
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since24h),
    supabaseAdmin
      .from('system_alerts')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', since24h),
    supabaseAdmin
      .from('ip_access_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]),
  ])

  return {
    database: dbHealth,
    errorLogs24h: errors24h.count || 0,
    systemAlerts24h: alerts24h.count || 0,
    ipLogsToday: ipToday.count || 0,
    checkedAt: new Date().toISOString(),
  }
}
