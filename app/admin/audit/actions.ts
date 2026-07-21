'use server'

import { requireAdminAuth, getSupabaseAdmin } from '@/lib/admin-auth'

/**
 * 감사 로그 조회 (필터링 + 페이지네이션)
 */
export async function getAuditLogs(options: {
  startDate?: string
  endDate?: string
  action?: string
  userId?: string
  ipAddress?: string
  page?: number
  pageSize?: number
  limit?: number
} = {}) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(
    100,
    Math.max(1, options.pageSize ?? options.limit ?? 50)
  )
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabaseAdmin
    .from('audit_logs')
    .select(
      `
      *,
      user_profiles!audit_logs_user_id_fkey (
        email,
        name
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate)
  }
  if (options.action) {
    query = query.eq('action', options.action)
  }
  if (options.userId) {
    query = query.eq('user_id', options.userId)
  }
  if (options.ipAddress) {
    query = query.ilike('ip_address', `%${options.ipAddress}%`)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`감사 로그 조회 실패: ${error.message}`)
  }

  return {
    logs: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  }
}

/**
 * 감사 로그 통계
 */
export async function getAuditStats(days: number = 7) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const startDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString()

  const { count: totalCount } = await supabaseAdmin
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)

  const { data: actionStats } = await supabaseAdmin
    .from('audit_logs')
    .select('action')
    .gte('created_at', startDate)

  const actionCounts = new Map<string, number>()
  actionStats?.forEach((log) => {
    actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1)
  })

  const { data: userStats } = await supabaseAdmin
    .from('audit_logs')
    .select('user_id')
    .gte('created_at', startDate)

  const userCounts = new Map<string, number>()
  userStats?.forEach((log) => {
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
 * 감사 로그 내보내기 (CSV용)
 */
export async function exportAuditLogs(
  startDate?: string,
  endDate?: string,
  action?: string
) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  let query = supabaseAdmin
    .from('audit_logs')
    .select(
      `
      *,
      user_profiles!audit_logs_user_id_fkey (
        email,
        name
      )
    `
    )
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
