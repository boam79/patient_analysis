import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isValidIp } from '@/lib/ip-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'

// Service Role Key를 사용하여 RLS를 우회하고 직접 삽입
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, method = 'GET', statusCode = 200, responseTime } = body

    // IP 주소 추출
    const ipAddress = getClientIp(request)
    
    if (!isValidIp(ipAddress)) {
      return NextResponse.json(
        { error: 'Invalid IP address' },
        { status: 400 }
      )
    }

    // Rate limiting: 인증 없이 호출 가능한 엔드포인트이므로 IP당 요청량 제한
    const rateLimit = await checkRateLimit(ipAddress, 'log-ip', {
      maxRequests: 60,
      windowSeconds: 60,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      )
    }

    // User-Agent, Referer 추출
    const userAgent = request.headers.get('user-agent') || null
    const referer = request.headers.get('referer') || null

    // IP 로그 저장 (비동기, 에러 무시 - 로그 실패가 서비스에 영향 주지 않도록)
    // void를 사용하여 Promise를 명시적으로 무시
    void (async () => {
      try {
        const { error } = await supabaseAdmin
          .from('ip_access_logs')
          .insert({
            ip_address: ipAddress,
            path: path || '/',
            method,
            user_agent: userAgent,
            referer: referer,
            status_code: statusCode,
            response_time: responseTime,
          })
        
        if (error) {
          console.error('Failed to log IP access:', error)
        }
      } catch (err: unknown) {
        console.error('IP logging error:', err)
      }
    })()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('IP logging API error:', error)
    // 에러가 발생해도 200 반환 (로그 실패가 서비스에 영향 주지 않도록)
    return NextResponse.json({ success: false })
  }
}

