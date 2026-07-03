// 지오코딩 배치 처리 시스템

interface GeocodingRequest {
  address: string
  index: number
}

interface GeocodingResult {
  address: string
  latitude: number | null
  longitude: number | null
  h3Index: string | null
  error: string | null
  index: number
}

const RATE_LIMIT_DELAY = 1000 // 1초 (Nominatim 공식 서버 레이트 리밋)
const BATCH_SIZE = 10 // 한 번에 처리할 배치 크기
const MAX_RETRIES = 3

/**
 * 주소 배열을 지오코딩하는 배치 처리 함수
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
  const total = addresses.length
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
  
  // 배치별로 처리
  for (let i = 0; i < uniqueAddresses.length; i += BATCH_SIZE) {
    const batch = uniqueAddresses.slice(i, i + BATCH_SIZE)
    
    const batchResults = await Promise.all(
      batch.map(async (address) => {
        return await geocodeAddressWithRetry(address, MAX_RETRIES)
      })
    )
    
    // 결과를 원래 인덱스에 맞게 복사
    batchResults.forEach((result, batchIndex) => {
      const address = batch[batchIndex]
      const indices = addressIndexMap.get(address) || []
      
      indices.forEach((originalIndex) => {
        results[originalIndex] = {
          ...result,
          index: originalIndex,
        }
      })
    })
    
    // 진행률 업데이트
    if (onProgress) {
      const completed = Math.min(i + BATCH_SIZE, uniqueAddresses.length)
      onProgress(completed, uniqueAddresses.length)
    }
    
    // 레이트 리밋 대기 (마지막 배치가 아닌 경우)
    if (i + BATCH_SIZE < uniqueAddresses.length) {
      await sleep(rateLimitDelay * BATCH_SIZE)
    }
  }
  
  return results
}

/**
 * 재시도 로직이 있는 단일 주소 지오코딩
 */
async function geocodeAddressWithRetry(
  address: string,
  maxRetries: number
): Promise<Omit<GeocodingResult, 'index'>> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
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

