'use server'

import { requireAdminAuth, getSupabaseAdmin } from '@/lib/admin-auth'

/**
 * 국가별 접근 통계 (Top N)
 */
export async function getIpAccessCountryStats(limit: number = 10) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const { data: ipLogs, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('country, ip_address')
    .not('country', 'is', null)
    .limit(10000)

  if (error) {
    throw new Error(`국가별 통계 조회 실패: ${error.message}`)
  }

  // 국가별 집계
  const countryStats = new Map<string, { count: number; uniqueIps: Set<string> }>()
  
  ipLogs?.forEach(log => {
    if (log.country && log.ip_address) {
      if (!countryStats.has(log.country)) {
        countryStats.set(log.country, { count: 0, uniqueIps: new Set() })
      }
      
      const stats = countryStats.get(log.country)!
      stats.count++
      stats.uniqueIps.add(log.ip_address)
    }
  })

  return Array.from(countryStats.entries())
    .map(([country, stats]) => ({
      country: String(country || ''),
      access_count: Number(stats.count || 0),
      unique_ips: Number(stats.uniqueIps.size || 0),
    }))
    .sort((a, b) => b.access_count - a.access_count)
    .slice(0, limit)
    .filter(item => item.country && item.access_count > 0)
}

/**
 * 사용자 가입 추이 (월별)
 */
export async function getUserSignupTrend(months: number = 12) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(10000)

  if (error) {
    throw new Error(`사용자 가입 추이 조회 실패: ${error.message}`)
  }

  // 월별 집계
  const monthlyStats = new Map<string, number>()
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - months)

  data?.forEach(user => {
    const date = new Date(user.created_at)
    if (date >= cutoffDate) {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyStats.set(monthKey, (monthlyStats.get(monthKey) || 0) + 1)
    }
  })

  return Array.from(monthlyStats.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * 역할별 사용자 분포
 */
export async function getUserRoleDistribution() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('role, is_approved')

  if (error) {
    throw new Error(`역할별 분포 조회 실패: ${error.message}`)
  }

  // 역할별 집계
  const roleStats = new Map<string, { total: number; approved: number }>()
  
  data?.forEach(user => {
    if (!roleStats.has(user.role)) {
      roleStats.set(user.role, { total: 0, approved: 0 })
    }
    const stats = roleStats.get(user.role)!
    stats.total++
    if (user.is_approved) {
      stats.approved++
    }
  })

  return Array.from(roleStats.entries())
    .map(([role, stats]) => ({
      role,
      total: stats.total,
      approved: stats.approved,
      pending: stats.total - stats.approved,
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * 활성 사용자 통계
 */
export async function getActiveUserStats(days: number = 30) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // 활성 사용자 수
  const { data: activeUsers, error: activeError } = await supabaseAdmin
    .from('user_sessions')
    .select('user_id, login_at, created_at')
    .gte('login_at', startDate)

  if (activeError) {
    throw new Error(`활성 사용자 통계 조회 실패: ${activeError.message}`)
  }

  const uniqueActiveUsers = new Set(activeUsers?.map(s => s.user_id) || []).size

  // 일별 활성 사용자 추이
  const dailyActive = new Map<string, Set<string>>()
  activeUsers?.forEach(session => {
    if (session.user_id) {
      const date = new Date(session.login_at || session.created_at)
      const dateKey = date.toISOString().split('T')[0]
      if (!dailyActive.has(dateKey)) {
        dailyActive.set(dateKey, new Set())
      }
      dailyActive.get(dateKey)!.add(session.user_id)
    }
  })

  return {
    totalActive: uniqueActiveUsers,
    dailyActive: Array.from(dailyActive.entries())
      .map(([date, users]) => ({ date, count: users.size }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

/**
 * 사용량 통계 (로그인, 세션)
 */
export async function getUsageStats(days: number = 30) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: sessions, error } = await supabaseAdmin
    .from('user_sessions')
    .select('login_at, session_duration, page_views, created_at')
    .gte('created_at', startDate)

  if (error) {
    throw new Error(`사용량 통계 조회 실패: ${error.message}`)
  }

  const totalLogins = sessions?.length || 0
  const avgSessionDuration = sessions?.reduce((sum, s) => sum + (s.session_duration || 0), 0) / (sessions?.length || 1) || 0
  const totalPageViews = sessions?.reduce((sum, s) => sum + (s.page_views || 0), 0) || 0

  // 시간대별 로그인 분포
  const hourlyLogins = new Map<number, number>()
  sessions?.forEach(session => {
    const date = new Date(session.login_at || session.created_at)
    const hour = date.getHours()
    hourlyLogins.set(hour, (hourlyLogins.get(hour) || 0) + 1)
  })

  return {
    totalLogins,
    avgSessionDuration: Math.round(avgSessionDuration),
    totalPageViews,
    hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyLogins.get(i) || 0,
    })),
  }
}

/**
 * 전체 통계 요약
 */
export async function getStatisticsSummary() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  // 총 사용자 수
  const { count: totalUsers } = await supabaseAdmin
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  // 승인된 사용자 수
  const { count: approvedUsers } = await supabaseAdmin
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', true)

  // 최근 30일 활성 사용자
  const { data: recentSessions } = await supabaseAdmin
    .from('user_sessions')
    .select('user_id, login_at')
    .gte('login_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const activeUsers = new Set(recentSessions?.map(s => s.user_id) || []).size

  // 총 세션 수
  const { count: totalSessions } = await supabaseAdmin
    .from('user_sessions')
    .select('*', { count: 'exact', head: true })

  return {
    totalUsers: totalUsers || 0,
    approvedUsers: approvedUsers || 0,
    pendingUsers: (totalUsers || 0) - (approvedUsers || 0),
    activeUsers,
    totalSessions: totalSessions || 0,
  }
}

/**
 * IP 접근 통계 요약
 */
export async function getIpAccessSummary() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  // 총 IP 로그 수
  const { count: totalIpLogs } = await supabaseAdmin
    .from('ip_access_logs')
    .select('*', { count: 'exact', head: true })

  // 오늘 IP 로그 수
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: todayIpLogs } = await supabaseAdmin
    .from('ip_access_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // 고유 IP 수
  const { data: uniqueIps } = await supabaseAdmin
    .from('ip_access_logs')
    .select('ip_address')
    .limit(10000)

  const uniqueIpCount = new Set(uniqueIps?.map(log => log.ip_address) || []).size

  return {
    totalIpLogs: totalIpLogs || 0,
    todayIpLogs: todayIpLogs || 0,
    uniqueIpCount,
  }
}

/**
 * IP 접근 추이 (일별)
 */
export async function getIpAccessTrend(days: number = 30) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: ipLogs, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('created_at, ip_address')
    .gte('created_at', startDate)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`IP 접근 추이 조회 실패: ${error.message}`)
  }

  // 일별 집계
  const dailyStats = new Map<string, { count: number; uniqueIps: Set<string> }>()
  
  ipLogs?.forEach(log => {
    const date = new Date(log.created_at)
    const dateKey = date.toISOString().split('T')[0]
    
    if (!dailyStats.has(dateKey)) {
      dailyStats.set(dateKey, { count: 0, uniqueIps: new Set() })
    }
    
    const stats = dailyStats.get(dateKey)!
    stats.count++
    stats.uniqueIps.add(log.ip_address)
  })

  return Array.from(dailyStats.entries())
    .map(([date, stats]) => ({
      date,
      count: stats.count,
      uniqueIps: stats.uniqueIps.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * IP 접근 시간대별 분포
 */
export async function getIpAccessHourlyDistribution(days: number = 30) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: ipLogs, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('created_at')
    .gte('created_at', startDate)

  if (error) {
    throw new Error(`IP 접근 시간대별 분포 조회 실패: ${error.message}`)
  }

  // 시간대별 집계
  const hourlyStats = new Map<number, number>()
  
  ipLogs?.forEach(log => {
    const date = new Date(log.created_at)
    const hour = date.getHours()
    hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1)
  })

  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourlyStats.get(i) || 0,
  }))
}

/**
 * IP 접근 경로별 통계
 */
export async function getIpAccessPathStats() {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const { data: ipLogs, error } = await supabaseAdmin
    .from('ip_access_logs')
    .select('path, ip_address')
    .limit(10000)

  if (error) {
    throw new Error(`IP 접근 경로별 통계 조회 실패: ${error.message}`)
  }

  // 경로별 집계
  const pathStats = new Map<string, { count: number; uniqueIps: Set<string> }>()
  
  ipLogs?.forEach(log => {
    if (!pathStats.has(log.path)) {
      pathStats.set(log.path, { count: 0, uniqueIps: new Set() })
    }
    
    const stats = pathStats.get(log.path)!
    stats.count++
    stats.uniqueIps.add(log.ip_address)
  })

  return Array.from(pathStats.entries())
    .map(([path, stats]) => ({
      path,
      count: stats.count,
      uniqueIps: stats.uniqueIps.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10
}

