import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  
  // 로그인 페이지나 인증 관련 경로는 통과
  // 주의: /login은 일반 사용자 로그인 페이지 (현재 기능만 구현, 실제 사용은 나중에 활성화 예정)
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/login')
  ) {
    return supabaseResponse
  }

  // 보호된 경로 접근 시 사용자 확인
  if (pathname.startsWith('/admin')) {
    // 로그인하지 않은 사용자
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login-admin'
      return NextResponse.redirect(url)
    }

    // 사용자 프로필 조회 (승인 상태 확인)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .single()

    // ADMIN 경로 접근 시: ADMIN 역할 및 승인 확인
    if (!profile || !profile.is_approved || profile.role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/login-admin'
      return NextResponse.redirect(url)
    }
  }
  
  // DASHBOARD 경로는 공개 접근 가능 (로그인 불필요)
  // 아직 로그인 기능을 구현하지 않음
  // 로그인한 사용자가 있어도 리다이렉트하지 않음

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}

