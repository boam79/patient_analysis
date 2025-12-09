'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Service Role Key 확인 및 경고
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[IP Statistics] ⚠️ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. ANON_KEY를 사용하지만 RLS 정책 때문에 데이터 조회가 실패할 수 있습니다.')
}

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Top 10 접근 IP 통계
 */
export async function getTopIps(limit: number = 10) {
  try {
    const supabase = await createClient()
    
    // ADMIN 역할 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('getTopIps auth error:', authError)
      throw new Error(`인증 오류: ${authError.message}`)
    }
    
    if (!user) {
      console.error('getTopIps: No user found')
      throw new Error('인증이 필요합니다.')
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('getTopIps profile error:', profileError)
      throw new Error(`프로필 조회 실패: ${profileError.message}`)
    }

    if (!profile || profile.role !== 'ADMIN') {
      console.error('getTopIps: Not admin, role:', profile?.role)
      throw new Error('관리자만 접근할 수 있습니다.')
    }

    // 직접 쿼리로 집계
    console.log('[getTopIps] Querying ip_access_logs...')
    const { data: queryData, error: queryError } = await supabaseAdmin
      .from('ip_access_logs')
      .select('ip_address')
      .limit(10000)

    if (queryError) {
      console.error('[getTopIps] Query error:', queryError)
      console.error('[getTopIps] Error details:', {
        message: queryError.message,
        details: queryError.details,
        hint: queryError.hint,
        code: queryError.code,
      })
      throw new Error(`IP 통계 조회 실패: ${queryError.message}`)
    }

    console.log('[getTopIps] Query result:', {
      dataLength: queryData?.length || 0,
      hasData: !!queryData && queryData.length > 0,
    })

    if (!queryData || queryData.length === 0) {
      console.log('[getTopIps] No data found in ip_access_logs table')
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
      .map(([ip, count]) => ({ 
        ip_address: String(ip || ''), 
        access_count: Number(count || 0) 
      }))
      .sort((a, b) => b.access_count - a.access_count)
      .slice(0, limit)
      .filter(item => item.ip_address && item.access_count > 0)

    console.log('[getTopIps] Final result:', JSON.stringify(result), 'count:', result.length)
    return result
  } catch (error: any) {
    console.error('getTopIps error:', error)
    throw error
  }
}

/**
 * 시간대별 접근 통계 (최근 24시간)
 */
export async function getHourlyStats(days: number = 1) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('getHourlyStats auth error:', authError)
      throw new Error(`인증 오류: ${authError.message}`)
    }
    
    if (!user) {
      console.error('getHourlyStats: No user found')
      throw new Error('인증이 필요합니다.')
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('getHourlyStats profile error:', profileError)
      throw new Error(`프로필 조회 실패: ${profileError.message}`)
    }

    if (!profile || profile.role !== 'ADMIN') {
      console.error('getHourlyStats: Not admin, role:', profile?.role)
      throw new Error('관리자만 접근할 수 있습니다.')
    }

  console.log('[getHourlyStats] Querying ip_access_logs for last', days, 'days...')
  const { data, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('created_at, ip_address')
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getHourlyStats] Query error:', error)
    console.error('[getHourlyStats] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    throw new Error(`시간대별 통계 조회 실패: ${error.message}`)
  }

  console.log('[getHourlyStats] Query result:', {
    dataLength: data?.length || 0,
    hasData: !!data && data.length > 0,
  })

  if (!data || data.length === 0) {
    console.log('[getHourlyStats] No data found in ip_access_logs table for last', days, 'days')
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
        hour: String(hour || ''),
        access_count: Number(stats.count || 0),
        unique_ips: Number(stats.uniqueIps.size || 0),
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour))
      .filter(item => item.hour && item.access_count > 0)

    console.log('[getHourlyStats] Final result:', JSON.stringify(result), 'count:', result.length)
    return result
  } catch (error: any) {
    console.error('getHourlyStats error:', error)
    throw error
  }
}

/**
 * 경로별 접근 통계
 */
export async function getPathStats() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('getPathStats auth error:', authError)
      throw new Error(`인증 오류: ${authError.message}`)
    }
    
    if (!user) {
      console.error('getPathStats: No user found')
      throw new Error('인증이 필요합니다.')
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('getPathStats profile error:', profileError)
      throw new Error(`프로필 조회 실패: ${profileError.message}`)
    }

    if (!profile || profile.role !== 'ADMIN') {
      console.error('getPathStats: Not admin, role:', profile?.role)
      throw new Error('관리자만 접근할 수 있습니다.')
    }

  console.log('[getPathStats] Querying ip_access_logs...')
  const { data, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('path, ip_address')
    .limit(10000)

  if (error) {
    console.error('[getPathStats] Query error:', error)
    console.error('[getPathStats] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    throw new Error(`경로별 통계 조회 실패: ${error.message}`)
  }

  console.log('[getPathStats] Query result:', {
    dataLength: data?.length || 0,
    hasData: !!data && data.length > 0,
  })

  if (!data || data.length === 0) {
    console.log('[getPathStats] No data found in ip_access_logs table')
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
        path: String(path || ''),
        access_count: Number(stats.count || 0),
        unique_ips: Number(stats.uniqueIps.size || 0),
      }))
      .sort((a, b) => b.access_count - a.access_count)
      .filter(item => item.path && item.access_count > 0)

    console.log('[getPathStats] Final result:', JSON.stringify(result), 'count:', result.length)
    return result
  } catch (error: any) {
    console.error('getPathStats error:', error)
    throw error
  }
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

