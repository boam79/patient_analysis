import { createClient } from '@supabase/supabase-js'

// Service Role Key로 RLS를 우회. 인증 없이 호출 가능한 API 라우트를 보호하기 위한 용도.
const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Supabase RPC(check_rate_limit) 기반 슬라이딩 윈도우 rate limiter.
 *
 * 서버리스 다중 인스턴스 환경에서도 정확하게 동작하도록 상태를 Postgres에
 * 저장한다(인메모리 방식은 인스턴스마다 별도 카운트를 가져 신뢰할 수 없음).
 *
 * RPC 함수가 아직 배포되지 않았거나(마이그레이션 미실행) Supabase 호출 자체가
 * 실패하는 경우 "허용"으로 처리(fail-open)하여 rate limiter 장애가 서비스
 * 가용성에 영향을 주지 않도록 한다.
 */
export async function checkRateLimit(
  ipAddress: string,
  endpoint: string,
  options: { maxRequests: number; windowSeconds: number }
): Promise<RateLimitResult> {
  const { maxRequests, windowSeconds } = options

  if (!supabaseAdmin) {
    return { allowed: true, remaining: maxRequests, retryAfterSeconds: 0 }
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_ip_address: ipAddress,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    })

    if (error || !data || data.length === 0) {
      // RPC 미배포(마이그레이션 미실행) 등의 이유로 실패해도 서비스는 계속 동작해야 함
      console.error('Rate limit check failed, failing open:', error)
      return { allowed: true, remaining: maxRequests, retryAfterSeconds: 0 }
    }

    const result = data[0] as { allowed: boolean; current_count: number; retry_after_seconds: number }
    return {
      allowed: result.allowed,
      remaining: Math.max(0, maxRequests - result.current_count),
      retryAfterSeconds: result.retry_after_seconds || 0,
    }
  } catch (error) {
    console.error('Rate limit check error, failing open:', error)
    return { allowed: true, remaining: maxRequests, retryAfterSeconds: 0 }
  }
}
