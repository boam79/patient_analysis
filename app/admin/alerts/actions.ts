'use server'

import { requireAdminAuth, getSupabaseAdmin } from '@/lib/admin-auth'

export async function getSystemAlertsPage(options: {
  page?: number
  pageSize?: number
  severity?: string
} = {}) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 50))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabaseAdmin
    .from('system_alerts')
    .select('*', { count: 'exact' })
    .order('sent_at', { ascending: false })
    .range(from, to)

  if (options.severity && options.severity !== 'all') {
    query = query.eq('severity', options.severity)
  }

  const { data, error, count } = await query
  if (error) {
    throw new Error(`시스템 알림 조회 실패: ${error.message}`)
  }

  return {
    alerts: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  }
}

export async function getSystemAlertStats() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [total, last24h, last7d] = await Promise.all([
    supabaseAdmin
      .from('system_alerts')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('system_alerts')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', since24h),
    supabaseAdmin
      .from('system_alerts')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', since7d),
  ])

  return {
    total: total.count || 0,
    last24h: last24h.count || 0,
    last7d: last7d.count || 0,
  }
}
