/**
 * IP Geolocation 유틸리티
 * ip-api.com 무료 API 사용 (분당 45회 제한)
 * 동일 IP 결과를 1시간 동안 메모리에 캐싱하여 API 호출을 최소화합니다.
 */

interface GeolocationResult {
  country: string | null
  city: string | null
  countryCode: string | null
}

interface CacheEntry {
  result: GeolocationResult
  expiresAt: number
}

// 인메모리 캐시 (서버 재시작 시 초기화됨)
const geoCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1시간

const EMPTY_RESULT: GeolocationResult = { country: null, city: null, countryCode: null }

/**
 * 프라이빗/로컬 IP 여부를 확인합니다.
 * RFC 1918 (10/8, 172.16/12, 192.168/16), 루프백(127/8), IPv6 루프백(::1)을 처리합니다.
 */
function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip || ip === 'unknown' || ip === '::1') return true

  // IPv4 파싱
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    // IPv6인 경우 루프백만 처리
    return ip.startsWith('::ffff:127.') || ip === '::1'
  }

  const [a, b] = parts

  // 127.0.0.0/8 (루프백)
  if (a === 127) return true
  // 10.0.0.0/8
  if (a === 10) return true
  // 172.16.0.0/12 (172.16.x.x ~ 172.31.x.x)
  if (a === 172 && b >= 16 && b <= 31) return true
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true

  return false
}

/**
 * IP 주소로부터 국가 및 도시 정보 조회
 * - 프라이빗/로컬 IP는 즉시 null 반환
 * - 동일 IP는 1시간 동안 캐싱
 * - ip-api.com 무료 API 사용 (HTTPS, 분당 45회 제한)
 */
export async function getIpGeolocation(ip: string): Promise<GeolocationResult> {
  if (isPrivateOrLocalIp(ip)) return EMPTY_RESULT

  // 캐시 확인
  const cached = geoCache.get(ip)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result
  }

  try {
    // ip-api.com: 무료 플랜은 HTTP만 지원하지만, 서버 사이드(미들웨어)에서는 HTTP 사용 가능.
    // 단, 클라이언트에서 직접 호출 시 Mixed Content 문제가 발생하므로 항상 서버 사이드에서만 사용.
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        // Edge Runtime에서 기본 타임아웃이 없으므로 AbortController로 제한
        signal: AbortSignal.timeout(3000),
      }
    )

    if (!response.ok) {
      const result = EMPTY_RESULT
      geoCache.set(ip, { result, expiresAt: Date.now() + CACHE_TTL_MS })
      return result
    }

    const data = await response.json()

    if (data.status === 'fail') {
      const result = EMPTY_RESULT
      geoCache.set(ip, { result, expiresAt: Date.now() + CACHE_TTL_MS })
      return result
    }

    const result: GeolocationResult = {
      country: data.country ?? null,
      city: data.city ?? null,
      countryCode: data.countryCode ?? null,
    }

    geoCache.set(ip, { result, expiresAt: Date.now() + CACHE_TTL_MS })
    return result
  } catch {
    // 타임아웃 또는 네트워크 오류 — 빈 결과를 짧게 캐싱(5분)하여 재시도 폭증 방지
    const result = EMPTY_RESULT
    geoCache.set(ip, { result, expiresAt: Date.now() + 5 * 60 * 1000 })
    return result
  }
}

/** 캐시 크기 반환 (모니터링용) */
export function getGeoCacheSize(): number {
  return geoCache.size
}

/** 만료된 캐시 항목 정리 */
export function purgeExpiredGeoCache(): number {
  const now = Date.now()
  let removed = 0
  for (const [key, entry] of geoCache.entries()) {
    if (entry.expiresAt <= now) {
      geoCache.delete(key)
      removed++
    }
  }
  return removed
}
