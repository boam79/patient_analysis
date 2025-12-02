'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * 감사 로그 조회 (필터링 지원)
 */
export async function getAuditLogs(
  startDate?: string,
  endDate?: string,
  action?: string,
  userId?: string,
  ipAddress?: string,
  limit: number = 100
) {
  const supabase = await createClient()
  
  // ADMIN 역할 확인
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

  let query = supabaseAdmin
    .from('audit_logs')
    .select(`
      *,
      user_profiles!audit_logs_user_id_fkey (
        email,
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
  if (action) {
    query = query.eq('action', action)
  }
  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (ipAddress) {
    query = query.ilike('ip_address', `%${ipAddress}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`감사 로그 조회 실패: ${error.message}`)
  }

  return data || []
}

/**
 * 감사 로그 통계
 */
export async function getAuditStats(days: number = 7) {
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

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // 전체 통계
  const { count: totalCount } = await supabaseAdmin
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)

  // 액션별 통계
  const { data: actionStats } = await supabaseAdmin
    .from('audit_logs')
    .select('action')
    .gte('created_at', startDate)

  const actionCounts = new Map<string, number>()
  actionStats?.forEach(log => {
    actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1)
  })

  // 사용자별 통계
  const { data: userStats } = await supabaseAdmin
    .from('audit_logs')
    .select('user_id')
    .gte('created_at', startDate)

  const userCounts = new Map<string, number>()
  userStats?.forEach(log => {
    if (log.user_id) {
      userCounts.set(log.user_id, (userCounts.get(log.user_id) || 0) + 1)
    }
  })

  return {
    total: totalCount || 0,
    actionCounts: Array.from(actionCounts.entries()).map(([action, count]) => ({
      action,
      count,
    })),
    topUsers: Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  }
}

/**
 * 감사 로그 내보내기 (CSV)
 */
export async function exportAuditLogs(
  startDate?: string,
  endDate?: string,
  action?: string
) {
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

  let query = supabaseAdmin
    .from('audit_logs')
    .select(`
      *,
      user_profiles!audit_logs_user_id_fkey (
        email,
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
  if (action) {
    query = query.eq('action', action)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`로그 내보내기 실패: ${error.message}`)
  }

  return data || []
}

