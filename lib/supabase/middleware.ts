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

/** 유지보수 중에도 허용하는 API (최소 집합) */
function isMaintenanceApiExempt(pathname: string): boolean {
  return (
    pathname === '/api/health' ||
    pathname === '/api/log-error' ||
    pathname.startsWith('/api/cron/')
  )
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

  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return supabaseResponse
  }

  const isMaintenanceExempt =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname === '/maintenance' ||
    isMaintenanceApiExempt(pathname)

  if (!isMaintenanceExempt) {
    const service = getServiceClient()

    // fail-closed: service role 없으면 유지보수 중으로 간주 (비ADMIN 차단)
    let maintenanceEnabled = !service

    if (service) {
      const { data: setting, error } = await service
        .from('settings')
        .select('value')
        .eq('key', 'maintenance.enabled')
        .maybeSingle()

      if (error) {
        maintenanceEnabled = true
      } else {
        maintenanceEnabled =
          setting?.value === 'true' || setting?.value === '"true"'
      }
    }

    if (maintenanceEnabled) {
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
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Service under maintenance' },
            { status: 503 }
          )
        }
        const url = request.nextUrl.clone()
        url.pathname = '/maintenance'
        return NextResponse.redirect(url)
      }
    }
  }

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
