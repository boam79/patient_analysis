import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isValidIp } from '@/lib/ip-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'

// Service Role Key를 사용하여 RLS를 우회하고 직접 삽입
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const VALID_BOUNDARIES = ['app', 'global', 'dashboard', 'admin']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { boundary, message, stack, digest, path } = body

    if (!message || !VALID_BOUNDARIES.includes(boundary)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const ipAddress = getClientIp(request)

    // Rate limiting: 클라이언트 에러 폭주(예: 렌더링 루프 버그)로 인한 로그 폭증 방지
    if (isValidIp(ipAddress)) {
      const rateLimit = await checkRateLimit(ipAddress, 'log-error', {
        maxRequests: 20,
        windowSeconds: 60,
      })
      if (!rateLimit.allowed) {
        return NextResponse.json({ success: false }, { status: 429 })
      }
    }

    const userAgent = request.headers.get('user-agent') || null

    // 에러 로그 저장 (비동기, 실패해도 클라이언트 응답에는 영향 없음)
    void (async () => {
      try {
        const { error } = await supabaseAdmin.from('error_logs').insert({
          boundary,
          message: String(message).slice(0, 2000),
          stack: stack ? String(stack).slice(0, 8000) : null,
          digest: digest ? String(digest).slice(0, 200) : null,
          path: path ? String(path).slice(0, 500) : null,
          user_agent: userAgent,
          ip_address: isValidIp(ipAddress) ? ipAddress : null,
        })

        if (error) {
          console.error('Failed to log client error:', error)
        }
      } catch (err: unknown) {
        console.error('Error logging error:', err)
      }
    })()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('log-error API error:', error)
    return NextResponse.json({ success: false })
  }
}
