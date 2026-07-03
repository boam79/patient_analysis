// 지오코딩 배치 처리 시스템
// Nominatim 사용 정책(1 req/sec)을 준수하기 위해 순차 처리하며,
// IndexedDB 캐시(lib/indexeddb.ts)를 우선 조회하여 중복 요청을 방지합니다.

import { getAddressCache, saveAddressCache } from './indexeddb'
import { cleanAddress } from './preprocessor'

interface GeocodingResult {
  address: string
  latitude: number | null
  longitude: number | null
  h3Index: string | null
  error: string | null
  index: number
}

const RATE_LIMIT_DELAY = 1100 // Nominatim 공식 서버 레이트 리밋(1 req/sec)보다 약간 여유
const MAX_RETRIES = 3
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30일

/**
 * 주소 배열을 지오코딩하는 배치 처리 함수
 * - 중복 주소는 한 번만 요청
 * - IndexedDB에 캐시된 주소는 네트워크 요청 없이 즉시 반환
 * - 캐시 미스인 경우에만 Nominatim 레이트 리밋(1 req/sec)을 준수하며 순차 요청
 */
export async function geocodeBatch(
  addresses: string[],
  options: {
    onProgress?: (completed: number, total: number) => void
    onError?: (error: Error) => void
    rateLimitDelay?: number
  } = {}
): Promise<GeocodingResult[]> {
  const { onProgress, onError, rateLimitDelay = RATE_LIMIT_DELAY } = options
  const results: GeocodingResult[] = []

  // 중복 제거 (주소가 같으면 한 번만 요청)
  const uniqueAddresses = Array.from(new Set(addresses))
  const addressIndexMap = new Map<string, number[]>()

  addresses.forEach((address, index) => {
    if (!addressIndexMap.has(address)) {
      addressIndexMap.set(address, [])
    }
    addressIndexMap.get(address)!.push(index)
  })

  for (let i = 0; i < uniqueAddresses.length; i++) {
    const address = uniqueAddresses[i]

    let result: Omit<GeocodingResult, 'index'>
    let usedNetwork = false

    try {
      result = await geocodeAddressCached(address, MAX_RETRIES, (networkCalled) => {
        usedNetwork = networkCalled
      })
    } catch (error) {
      onError?.(error as Error)
      result = {
        address,
        latitude: null,
        longitude: null,
        h3Index: null,
        error: (error as Error).message || 'Unknown error',
      }
    }

    const indices = addressIndexMap.get(address) || []
    indices.forEach((originalIndex) => {
      results[originalIndex] = { ...result, index: originalIndex }
    })

    if (onProgress) {
      onProgress(i + 1, uniqueAddresses.length)
    }

    // 캐시 히트는 네트워크 요청이 없었으므로 대기하지 않음
    if (usedNetwork && i < uniqueAddresses.length - 1) {
      await sleep(rateLimitDelay)
    }
  }

  return results
}

/**
 * 캐시 우선 조회 후 필요한 경우에만 Nominatim API 호출 (재시도 포함)
 */
async function geocodeAddressCached(
  address: string,
  maxRetries: number,
  onNetworkCall: (called: boolean) => void
): Promise<Omit<GeocodingResult, 'index'>> {
  const cleanedAddress = cleanAddress(address)

  try {
    const cached = await getAddressCache(cleanedAddress)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      onNetworkCall(false)
      return {
        address,
        latitude: cached.latitude,
        longitude: cached.longitude,
        h3Index: cached.h3Index,
        error: null,
      }
    }
  } catch (error) {
    console.error('Address cache lookup failed:', error)
  }

  onNetworkCall(true)
  const result = await geocodeAddressWithRetry(address, cleanedAddress, maxRetries)

  if (result.latitude !== null && result.longitude !== null && result.h3Index !== null) {
    try {
      await saveAddressCache({
        address: cleanedAddress,
        latitude: result.latitude,
        longitude: result.longitude,
        h3Index: result.h3Index,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('Address cache save failed:', error)
    }
  }

  return result
}

/**
 * 재시도 로직이 있는 단일 주소 지오코딩
 */
async function geocodeAddressWithRetry(
  address: string,
  cleanedAddress: string,
  maxRetries: number
): Promise<Omit<GeocodingResult, 'index'>> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: cleanedAddress }),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          address,
          latitude: data.latitude,
          longitude: data.longitude,
          h3Index: data.h3Index,
          error: null,
        }
      } else {
        // 404 (주소를 찾을 수 없음)는 재시도하지 않음
        if (response.status === 404) {
          return {
            address,
            latitude: null,
            longitude: null,
            h3Index: null,
            error: 'Address not found',
          }
        }

        // 429 (레이트 리밋)는 더 긴 대기 시간으로 재시도
        if (response.status === 429) {
          await sleep(5000 * (attempt + 1))
          continue
        }

        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      lastError = error as Error

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries - 1) {
        await sleep(1000 * (attempt + 1))
      }
    }
  }

  // 모든 재시도 실패
  return {
    address,
    latitude: null,
    longitude: null,
    h3Index: null,
    error: lastError?.message || 'Unknown error',
  }
}

/**
 * 유틸리티: sleep 함수
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 지오코딩 통계 계산
 */
export function calculateGeocodingStats(results: GeocodingResult[]): {
  total: number
  success: number
  failed: number
  successRate: number
  errors: { [key: string]: number }
} {
  const total = results.length
  const success = results.filter((r) => r.latitude !== null).length
  const failed = total - success
  const successRate = total > 0 ? (success / total) * 100 : 0

  const errors: { [key: string]: number } = {}
  results.forEach((result) => {
    if (result.error) {
      errors[result.error] = (errors[result.error] || 0) + 1
    }
  })

  return {
    total,
    success,
    failed,
    successRate,
    errors,
  }
}
