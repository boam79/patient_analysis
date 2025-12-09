'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Top 10 접근 IP 통계
 */
export async function getTopIps(limit: number = 10) {
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

  // 직접 쿼리로 집계
  const { data: queryData, error: queryError } = await supabaseAdmin
    .from('ip_access_logs')
    .select('ip_address')
    .limit(10000)

  if (queryError) {
    console.error('getTopIps query error:', queryError)
    throw new Error(`IP 통계 조회 실패: ${queryError.message}`)
  }

  if (!queryData || queryData.length === 0) {
    console.log('getTopIps: No data found')
    return []
  }

  // 클라이언트 사이드에서 집계
  const ipCounts = new Map<string, number>()
  queryData.forEach(log => {
    if (log.ip_address) {
      ipCounts.set(log.ip_address, (ipCounts.get(log.ip_address) || 0) + 1)
    }
  })

  const result = Array.from(ipCounts.entries())
    .map(([ip, count]) => ({ ip_address: ip, access_count: count }))
    .sort((a, b) => b.access_count - a.access_count)
    .slice(0, limit)

  console.log('getTopIps result:', result)
  return result
}

/**
 * 시간대별 접근 통계 (최근 24시간)
 */
export async function getHourlyStats(days: number = 1) {
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
    .from('ip_access_logs')
    .select('created_at, ip_address')
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getHourlyStats query error:', error)
    throw new Error(`시간대별 통계 조회 실패: ${error.message}`)
  }

  if (!data || data.length === 0) {
    console.log('getHourlyStats: No data found')
    return []
  }

  // 시간대별 집계
  const hourlyStats = new Map<string, { count: number; uniqueIps: Set<string> }>()
  
  data.forEach(log => {
    if (log.created_at && log.ip_address) {
      const date = new Date(log.created_at)
      const hour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours())
      const hourKey = hour.toISOString()
      
      if (!hourlyStats.has(hourKey)) {
        hourlyStats.set(hourKey, { count: 0, uniqueIps: new Set() })
      }
      
      const stats = hourlyStats.get(hourKey)!
      stats.count++
      stats.uniqueIps.add(log.ip_address)
    }
  })

  const result = Array.from(hourlyStats.entries())
    .map(([hour, stats]) => ({
      hour,
      access_count: stats.count,
      unique_ips: stats.uniqueIps.size,
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour))

  console.log('getHourlyStats result:', result)
  return result
}

/**
 * 경로별 접근 통계
 */
export async function getPathStats() {
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
    .from('ip_access_logs')
    .select('path, ip_address')
    .limit(10000)

  if (error) {
    console.error('getPathStats query error:', error)
    throw new Error(`경로별 통계 조회 실패: ${error.message}`)
  }

  if (!data || data.length === 0) {
    console.log('getPathStats: No data found')
    return []
  }

  // 경로별 집계
  const pathStats = new Map<string, { count: number; uniqueIps: Set<string> }>()
  
  data.forEach(log => {
    if (log.path && log.ip_address) {
      if (!pathStats.has(log.path)) {
        pathStats.set(log.path, { count: 0, uniqueIps: new Set() })
      }
      
      const stats = pathStats.get(log.path)!
      stats.count++
      stats.uniqueIps.add(log.ip_address)
    }
  })

  const result = Array.from(pathStats.entries())
    .map(([path, stats]) => ({
      path,
      access_count: stats.count,
      unique_ips: stats.uniqueIps.size,
    }))
    .sort((a, b) => b.access_count - a.access_count)

  console.log('getPathStats result:', result)
  return result
}

/**
 * 이상 접근 패턴 감지
 */
export async function detectAnomalies() {
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

  // 최근 1시간 내 접근 로그
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  const { data, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('ip_address, created_at')
    .gte('created_at', oneHourAgo.toISOString())

  if (error) {
    throw new Error(`이상 패턴 감지 실패: ${error.message}`)
  }

  // IP별 접근 횟수 계산
  const ipCounts = new Map<string, number>()
  data?.forEach(log => {
    ipCounts.set(log.ip_address, (ipCounts.get(log.ip_address) || 0) + 1)
  })

  // 초당 10회 이상 접근한 IP 탐지
  const anomalies: Array<{ ip_address: string; access_count: number; rate: number }> = []
  
  ipCounts.forEach((count, ip) => {
    const rate = count / 3600 // 초당 접근 횟수
    if (rate >= 10) {
      anomalies.push({
        ip_address: ip,
        access_count: count,
        rate: Math.round(rate * 100) / 100,
      })
    }
  })

  return anomalies.sort((a, b) => b.access_count - a.access_count)
}

/**
 * IP 로그 내보내기 (CSV)
 */
export async function exportIpLogs(startDate?: string, endDate?: string, ipAddress?: string) {
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
    .from('ip_access_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10000)

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
  if (ipAddress) {
    query = query.eq('ip_address', ipAddress)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`로그 내보내기 실패: ${error.message}`)
  }

  return data || []
}

