import type { SupabaseClient } from '@supabase/supabase-js'

export interface AccessAnomaly {
  ip_address: string
  access_count: number
  rate_per_minute: number
  burst_5min: number
  severity: 'high' | 'medium'
}

/**
 * IP 접근 로그 기반 이상 패턴 감지 (순수 함수, 인증은 호출자 책임)
 * - 최근 1시간 내 동일 IP가 60회 이상 접근한 경우 탐지 (분당 1회 초과)
 * - 최근 5분 내 동일 IP가 30회 이상 접근한 경우 급증 탐지(high)
 *
 * 관리자 대시보드(app/admin/logs/actions.ts)와 시스템 알림 크론
 * (app/api/cron/anomaly-check/route.ts)에서 공통으로 사용한다.
 */
export async function detectAccessAnomalies(
  supabaseAdmin: SupabaseClient
): Promise<AccessAnomaly[]> {
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

  const hourCounts = new Map<string, number>()
  const fiveMinCounts = new Map<string, number>()

  data.forEach((log) => {
    if (!log.ip_address) return
    hourCounts.set(log.ip_address, (hourCounts.get(log.ip_address) || 0) + 1)

    if (log.created_at >= fiveMinutesAgo) {
      fiveMinCounts.set(log.ip_address, (fiveMinCounts.get(log.ip_address) || 0) + 1)
    }
  })

  const anomalies: AccessAnomaly[] = []

  hourCounts.forEach((count, ip) => {
    const ratePerMinute = count / 60
    const burst = fiveMinCounts.get(ip) || 0

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
