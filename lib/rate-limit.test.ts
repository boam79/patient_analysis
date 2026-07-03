import { describe, it, expect } from 'vitest'
import { checkRateLimit } from './rate-limit'

describe('checkRateLimit', () => {
  it('Supabase 환경변수가 없으면 fail-open으로 항상 허용한다', async () => {
    // 테스트 환경에는 NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY가 없으므로
    // 모듈 레벨에서 supabaseAdmin이 null이 되어 즉시 허용 응답을 반환해야 함
    const result = await checkRateLimit('127.0.0.1', 'test-endpoint', {
      maxRequests: 10,
      windowSeconds: 60,
    })

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(10)
    expect(result.retryAfterSeconds).toBe(0)
  })

  it('서로 다른 IP/엔드포인트 조합에도 동일하게 fail-open 동작한다', async () => {
    const result1 = await checkRateLimit('1.2.3.4', 'log-ip', {
      maxRequests: 60,
      windowSeconds: 60,
    })
    const result2 = await checkRateLimit('5.6.7.8', 'geocode', {
      maxRequests: 30,
      windowSeconds: 60,
    })

    expect(result1.allowed).toBe(true)
    expect(result2.allowed).toBe(true)
  })
})
