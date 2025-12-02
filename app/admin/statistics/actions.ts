'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * 사용자 가입 추이 (월별)
 */
export async function getUserSignupTrend(months: number = 12) {
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

  // 활성 사용자 수
  const { data: activeUsers, error: activeError } = await supabaseAdmin
    .from('user_sessions')
    .select('user_id')
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

  const { data: sessions, error } = await supabaseAdmin
    .from('user_sessions')
    .select('login_at, session_duration, page_views')
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
    .select('user_id')
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

