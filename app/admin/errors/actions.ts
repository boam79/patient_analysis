'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAuth, getSupabaseAdmin } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'
import { sanitizeSearchTerm } from '@/lib/admin-validation'

export async function getErrorLogsPage(options: {
  page?: number
  pageSize?: number
  boundary?: string
  search?: string
  startDate?: string
  endDate?: string
  resolved?: 'all' | 'open' | 'resolved'
} = {}) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 50))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabaseAdmin
    .from('error_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options.boundary && options.boundary !== 'all') {
    query = query.eq('boundary', options.boundary)
  }
  if (options.startDate) {
    query = query.gte('created_at', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('created_at', options.endDate)
  }
  if (options.resolved === 'open') {
    query = query.eq('resolved', false)
  } else if (options.resolved === 'resolved') {
    query = query.eq('resolved', true)
  }
  const q = options.search ? sanitizeSearchTerm(options.search) : ''
  if (q) {
    query = query.or(`message.ilike.%${q}%,path.ilike.%${q}%`)
  }

  const { data, error, count } = await query
  if (error) {
    const degraded =
      options.resolved === 'open' || options.resolved === 'resolved'
    throw new Error(
      degraded
        ? `에러 로그 조회 실패 (resolved 컬럼/마이그레이션 확인): ${error.message}`
        : `에러 로그 조회 실패: ${error.message}`
    )
  }

  return {
    logs: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  }
}

export async function exportErrorLogs(
  startDate?: string,
  endDate?: string,
  boundary?: string
) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  let query = supabaseAdmin
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10000)

  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate)
  if (boundary && boundary !== 'all') query = query.eq('boundary', boundary)

  const { data, error } = await query
  if (error) {
    throw new Error(`에러 로그 내보내기 실패: ${error.message}`)
  }
  return data || []
}

export async function resolveErrorLog(id: number, resolved: boolean = true) {
  const { userId } = await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from('error_logs')
    .update({
      resolved,
      resolved_at: resolved ? new Date().toISOString() : null,
      resolved_by: resolved ? userId : null,
    })
    .eq('id', id)

  if (error) {
    throw new Error(
      `에러 로그 상태 변경 실패 (resolved 컬럼 마이그레이션 확인): ${error.message}`
    )
  }

  await logAction({
    userId,
    action: resolved ? 'error.resolve' : 'error.reopen',
    resource: 'error_logs',
    details: { error_id: id },
  })

  revalidatePath('/admin/errors')
}

export async function getErrorStats() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [total, last24h, openResult] = await Promise.all([
    supabaseAdmin
      .from('error_logs')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since24h),
    supabaseAdmin
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false),
  ])

  if (openResult.error) {
    throw new Error(
      `미해결 에러 집계 실패 (resolved 컬럼 마이그레이션 확인): ${openResult.error.message}`
    )
  }

  return {
    total: total.count || 0,
    last24h: last24h.count || 0,
    open: openResult.count || 0,
  }
}
