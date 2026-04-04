/**
 * ⚠️ 이 파일은 현재 사용되지 않습니다.
 *
 * 인증 시스템은 Supabase Auth로 완전히 전환되었으며,
 * 접근 제어는 `lib/supabase/middleware.ts`의 `updateSession` 함수에서 처리됩니다.
 *
 * - 일반 사용자 로그인: Supabase Auth (/login)
 * - 관리자 인증: Supabase Auth + user_profiles.role === 'ADMIN' (/admin/login)
 * - 미들웨어 보호: middleware.ts → lib/supabase/middleware.ts
 *
 * NextAuth(next-auth) 의존성 및 관련 Prisma 모델(Account, Session, VerificationToken)은
 * 향후 정리 대상입니다.
 */

import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
  },
  callbacks: {
    authorized() {
      // Supabase Auth 미들웨어가 접근 제어를 담당하므로 항상 통과
      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
