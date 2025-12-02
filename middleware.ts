import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isValidIp } from '@/lib/ip-utils'
import { getIpGeolocation } from '@/lib/ip-geolocation'
import { createClient } from '@supabase/supabase-js'

// Service Role Key를 사용하여 RLS를 우회하고 직접 삽입
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
)

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

          const { error } = await supabaseAdmin
            .from('ip_access_logs')
            .insert({
              ip_address: ipAddress,
              path: request.nextUrl.pathname,
              method: request.method,
              user_agent: userAgent,
              referer: referer,
              country: country,
              city: city,
              status_code: 200,
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

