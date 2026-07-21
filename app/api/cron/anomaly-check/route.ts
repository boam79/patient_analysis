import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { detectAccessAnomalies } from '@/lib/anomaly-detection'
import { sendSlackAlert } from '@/lib/alerts'

const DEDUP_WINDOW_MINUTES = 30

/**
 * 시스템 이상탐지 주기 점검 및 Slack 알림.
 * CRON_SECRET 필수 (미설정 시 401 fail-closed).
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 401 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { skipped: true, reason: 'Supabase service role key not configured' },
      { status: 200 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  try {
    const anomalies = await detectAccessAnomalies(supabaseAdmin)
    const highSeverity = anomalies.filter((a) => a.severity === 'high')

    if (!process.env.SLACK_WEBHOOK_URL) {
      return NextResponse.json({
        checked: anomalies.length,
        highSeverity: highSeverity.length,
        alertsSent: 0,
        note: 'SLACK_WEBHOOK_URL not configured, alert delivery skipped',
      })
    }

    let alertsSent = 0
    for (const anomaly of highSeverity) {
      const alertKey = `anomaly:${anomaly.ip_address}`
      const dedupWindowStart = new Date(
        Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000
      ).toISOString()

      const { data: recentAlerts, error: recentError } = await supabaseAdmin
        .from('system_alerts')
        .select('id')
        .eq('alert_key', alertKey)
        .gte('sent_at', dedupWindowStart)
        .limit(1)

      if (recentError) {
        console.error('system_alerts lookup failed:', recentError)
        continue
      }

      if (recentAlerts && recentAlerts.length > 0) continue

      const message =
        `🚨 *병원 CRM 시스템 이상 접근 탐지*\n` +
        `> IP: \`${anomaly.ip_address}\`\n` +
        `> 최근 1시간 접근: ${anomaly.access_count}회 (분당 ${anomaly.rate_per_minute}회)\n` +
        `> 5분 내 급증: ${anomaly.burst_5min}회\n` +
        `> 심각도: ${anomaly.severity}`

      const sent = await sendSlackAlert(message)
      if (sent) {
        await supabaseAdmin.from('system_alerts').insert({
          alert_key: alertKey,
          severity: anomaly.severity,
          message,
        })
        alertsSent++
      }
    }

    return NextResponse.json({
      checked: anomalies.length,
      highSeverity: highSeverity.length,
      alertsSent,
    })
  } catch (error: unknown) {
    console.error('Anomaly check cron error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'cron failed' },
      { status: 500 }
    )
  }
}
