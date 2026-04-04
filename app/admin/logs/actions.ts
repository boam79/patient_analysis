'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/admin-auth'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.'
    )
  }

  return createAdminClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Top N 접근 IP 통계
 * Supabase RPC가 설치된 경우 DB 집계를 사용하고, 없으면 JS 집계로 폴백합니다.
 */
export async function getTopIps(limit: number = 10) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  // DB 레벨 RPC 집계 시도
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_top_ips', {
    limit_count: limit,
  })

  if (!rpcError && rpcData) {
    return rpcData as Array<{ ip_address: string; access_count: number }>
  }

  // RPC 미설치 시 JS 집계 폴백
  const { data, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('ip_address')
    .limit(10000)

  if (error) {
    throw new Error(`IP 통계 조회 실패: ${error.message}`)
  }

  if (!data || data.length === 0) return []

  const ipCounts = new Map<string, number>()
  data.forEach((log) => {
    if (log.ip_address) {
      ipCounts.set(log.ip_address, (ipCounts.get(log.ip_address) || 0) + 1)
    }
  })

  return Array.from(ipCounts.entries())
    .map(([ip, count]) => ({ ip_address: ip, access_count: count }))
    .sort((a, b) => b.access_count - a.access_count)
    .slice(0, limit)
    .filter((item) => item.ip_address && item.access_count > 0)
}

/**
 * 시간대별 접근 통계 (최근 N일)
 */
export async function getHourlyStats(days: number = 1) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // DB 레벨 RPC 집계 시도
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_hourly_stats', {
    since_time: since,
  })

  if (!rpcError && rpcData) {
    return rpcData as Array<{ hour: string; access_count: number; unique_ips: number }>
  }

  // RPC 미설치 시 JS 집계 폴백
  const { data, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('created_at, ip_address')
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`시간대별 통계 조회 실패: ${error.message}`)
  }

  if (!data || data.length === 0) return []

  const hourlyStats = new Map<string, { count: number; uniqueIps: Set<string> }>()

  data.forEach((log) => {
    if (!log.created_at || !log.ip_address) return

    const date = new Date(log.created_at)
    const hourKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}:00:00.000Z`

    const entry = hourlyStats.get(hourKey) ?? { count: 0, uniqueIps: new Set<string>() }
    entry.count++
    entry.uniqueIps.add(log.ip_address)
    hourlyStats.set(hourKey, entry)
  })

  return Array.from(hourlyStats.entries())
    .map(([hour, stats]) => ({
      hour,
      access_count: stats.count,
      unique_ips: stats.uniqueIps.size,
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour))
}

/**
 * 경로별 접근 통계
 */
export async function getPathStats() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  // DB 레벨 RPC 집계 시도
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_path_stats')

  if (!rpcError && rpcData) {
    return rpcData as Array<{ path: string; access_count: number; unique_ips: number }>
  }

  // RPC 미설치 시 JS 집계 폴백
  const { data, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('path, ip_address')
    .limit(10000)

  if (error) {
    throw new Error(`경로별 통계 조회 실패: ${error.message}`)
  }

  if (!data || data.length === 0) return []

  const pathStats = new Map<string, { count: number; uniqueIps: Set<string> }>()

  data.forEach((log) => {
    if (!log.path || !log.ip_address) return

    const entry = pathStats.get(log.path) ?? { count: 0, uniqueIps: new Set<string>() }
    entry.count++
    entry.uniqueIps.add(log.ip_address)
    pathStats.set(log.path, entry)
  })

  return Array.from(pathStats.entries())
    .map(([path, stats]) => ({
      path,
      access_count: stats.count,
      unique_ips: stats.uniqueIps.size,
    }))
    .sort((a, b) => b.access_count - a.access_count)
    .filter((item) => item.path && item.access_count > 0)
}

/**
 * 국가별 접근 통계
 */
export async function getCountryStats(limit: number = 10) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  // DB 레벨 RPC 집계 시도
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_country_stats', {
    limit_count: limit,
  })

  if (!rpcError && rpcData) {
    return rpcData as Array<{ country: string; access_count: number; unique_ips: number }>
  }

  // RPC 미설치 시 JS 집계 폴백
  const { data, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('country, ip_address')
    .not('country', 'is', null)
    .limit(10000)

  if (error) {
    throw new Error(`국가별 통계 조회 실패: ${error.message}`)
  }

  if (!data || data.length === 0) return []

  const countryStats = new Map<string, { count: number; uniqueIps: Set<string> }>()

  data.forEach((log) => {
    if (!log.country || !log.ip_address) return

    const entry = countryStats.get(log.country) ?? { count: 0, uniqueIps: new Set<string>() }
    entry.count++
    entry.uniqueIps.add(log.ip_address)
    countryStats.set(log.country, entry)
  })

  return Array.from(countryStats.entries())
    .map(([country, stats]) => ({
      country,
      access_count: stats.count,
      unique_ips: stats.uniqueIps.size,
    }))
    .sort((a, b) => b.access_count - a.access_count)
    .slice(0, limit)
    .filter((item) => item.country && item.access_count > 0)
}

/**
 * 이상 접근 패턴 감지
 * - 최근 1시간 내 동일 IP가 60회 이상 접근한 경우 탐지 (분당 1회 초과)
 * - 최근 5분 내 동일 IP가 30회 이상 접근한 경우 급증 탐지
 */
export async function detectAnomalies() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('ip_address, created_at')
    .gte('created_at', oneHourAgo)

  if (error) {
    throw new Error(`이상 패턴 감지 실패: ${error.message}`)
  }

  if (!data || data.length === 0) return []

  // IP별 1시간 카운트 및 5분 카운트
  const hourCounts = new Map<string, number>()
  const fiveMinCounts = new Map<string, number>()

  data.forEach((log) => {
    if (!log.ip_address) return
    hourCounts.set(log.ip_address, (hourCounts.get(log.ip_address) || 0) + 1)

    if (log.created_at >= fiveMinutesAgo) {
      fiveMinCounts.set(log.ip_address, (fiveMinCounts.get(log.ip_address) || 0) + 1)
    }
  })

  const anomalies: Array<{
    ip_address: string
    access_count: number
    rate_per_minute: number
    burst_5min: number
    severity: 'high' | 'medium'
  }> = []

  hourCounts.forEach((count, ip) => {
    const ratePerMinute = count / 60
    const burst = fiveMinCounts.get(ip) || 0

    // 분당 1회 초과(1시간 60회 이상) 또는 5분 내 30회 이상(급증)
    if (ratePerMinute >= 1 || burst >= 30) {
      anomalies.push({
        ip_address: ip,
        access_count: count,
        rate_per_minute: Math.round(ratePerMinute * 100) / 100,
        burst_5min: burst,
        severity: burst >= 30 ? 'high' : 'medium',
      })
    }
  })

  return anomalies.sort((a, b) => b.access_count - a.access_count)
}

/**
 * IP 로그 내보내기 (CSV)
 * 날짜 범위 필터를 필수로 받아 대용량 내보내기를 방지합니다.
 */
export async function exportIpLogs(
  startDate: string,
  endDate: string,
  ipAddress?: string
) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  if (!startDate || !endDate) {
    throw new Error('내보내기 시 시작일과 종료일은 필수입니다.')
  }

  let query = supabaseAdmin
    .from('ip_access_logs')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })
    .limit(50000)

  if (ipAddress) {
    query = query.eq('ip_address', ipAddress)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`로그 내보내기 실패: ${error.message}`)
  }

  return data || []
}
