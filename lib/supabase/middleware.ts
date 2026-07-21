import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 로그인·인증 관련 경로만 통과 (/admin/login* 임시 경로 예외 제거)
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return supabaseResponse
  }

  // 유지보수 모드: 비ADMIN의 /dashboard 및 루트 접근 차단 (ADMIN·API·login은 허용)
  const isMaintenanceExempt =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname === '/maintenance'

  if (!isMaintenanceExempt) {
    const service = getServiceClient()
    if (service) {
      const { data: setting } = await service
        .from('settings')
        .select('value')
        .eq('key', 'maintenance.enabled')
        .maybeSingle()

      const enabled =
        setting?.value === 'true' || setting?.value === '"true"'

      if (enabled) {
        let isAdmin = false
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, is_approved')
            .eq('id', user.id)
            .single()
          isAdmin =
            !!profile &&
            profile.role === 'ADMIN' &&
            profile.is_approved === true
        }

        if (!isAdmin) {
          const url = request.nextUrl.clone()
          url.pathname = '/maintenance'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  // 보호된 경로 접근 시 사용자 확인
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login-admin'
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_approved || profile.role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/login-admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
