import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isValidIp } from '@/lib/ip-utils'
import { getIpGeolocation } from '@/lib/ip-geolocation'
import { createClient } from '@supabase/supabase-js'

// Service Role Key 필수 — ANON 폴백 금지 (RLS silent fail 방지)
function getIpLogClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  
  // IP 로그 기록 (메인 대시보드 접근 시)
  const shouldLogIp = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname === '/'

  if (shouldLogIp) {
    // IP 주소 추출
    const ipAddress = getClientIp(request)
    
    // 유효한 IP인 경우에만 로그 기록
    if (isValidIp(ipAddress)) {
      const responseTime = Date.now() - startTime
      const userAgent = request.headers.get('user-agent') || null
      const referer = request.headers.get('referer') || null

      // 비동기로 IP 로그 기록 (응답 차단하지 않음)
      void (async () => {
        try {
          // IP Geolocation 정보 조회 (비동기, 실패해도 계속 진행)
          let country: string | null = null
          let city: string | null = null
          
          try {
            const geoInfo = await getIpGeolocation(ipAddress)
            country = geoInfo.country || null
            city = geoInfo.city || null
          } catch (geoError) {
            // Geolocation 실패는 무시 (로그 기록은 계속 진행)
            console.error('Geolocation failed:', geoError)
          }

          const supabaseAdmin = getIpLogClient()
          if (!supabaseAdmin) {
            console.error(
              'IP logging skipped: SUPABASE_SERVICE_ROLE_KEY not set'
            )
            return
          }

          const { error } = await supabaseAdmin.from('ip_access_logs').insert({
            ip_address: ipAddress,
            path: request.nextUrl.pathname,
            method: request.method,
            user_agent: userAgent,
            referer: referer,
            country: country,
            city: city,
            // 미들웨어는 응답 전에 실행되므로 실제 상태 코드를 알 수 없어 null로 기록
            status_code: null,
            response_time: responseTime,
          })

          if (error) {
            console.error('Failed to log IP access:', error)
          }
        } catch (err: unknown) {
          console.error('IP logging error:', err)
        }
      })()
    }
  }

  // Supabase 세션 갱신 및 접근 제어
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

