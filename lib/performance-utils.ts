/**
 * 성능 최적화 유틸리티
 */

// 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// 스로틀 함수
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 성능 측정 함수
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`)
}

// 비동기 성능 측정 함수
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`)
  return result
}

// 메모이제이션 헬퍼
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// LRU 캐시 구현 (제한된 크기)
export class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, V>

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined
    }

    const value = this.cache.get(key)!
    // 최근 사용으로 이동
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      // 가장 오래된 항목 제거
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

// 청크 처리 함수 (대용량 데이터 분할 처리)
export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]>,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = []
  const totalChunks = Math.ceil(items.length / chunkSize)

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, items.length)
    const chunk = items.slice(start, end)

    const chunkResults = await processor(chunk)
    results.push(...chunkResults)

    if (onProgress) {
      onProgress(end, items.length)
    }

    // 브라우저 메인 스레드에 여유 주기
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  return results
}

// 지연 로딩 헬퍼
export function lazyLoad<T>(
  loader: () => Promise<T>,
  delay: number = 0
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      loader().then(resolve)
    }, delay)
  })
}

// 요청 배칭 (여러 요청을 하나로 묶기)
export class RequestBatcher<T, R> {
  private queue: Array<{
    request: T
    resolve: (value: R) => void
    reject: (error: any) => void
  }> = []
  private batchSize: number
  private batchDelay: number
  private timeout: NodeJS.Timeout | null = null

  constructor(
    private processor: (requests: T[]) => Promise<R[]>,
    options: { batchSize?: number; batchDelay?: number } = {}
  ) {
    this.batchSize = options.batchSize || 10
    this.batchDelay = options.batchDelay || 50
  }

  async add(request: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ request, resolve, reject })

      if (this.queue.length >= this.batchSize) {
        this.flush()
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.batchDelay)
      }
    })
  }

  private async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    if (this.queue.length === 0) {
      return
    }

    const batch = this.queue.splice(0, this.batchSize)
    const requests = batch.map(item => item.request)

    try {
      const results = await this.processor(requests)
      
      batch.forEach((item, index) => {
        item.resolve(results[index])
      })
    } catch (error) {
      batch.forEach(item => {
        item.reject(error)
      })
    }
  }
}

// 리소스 사전 로드
export function preloadResource(url: string, as: 'script' | 'style' | 'image' | 'fetch'): void {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = as
  link.href = url
  document.head.appendChild(link)
}

// 이미지 지연 로딩
export function lazyLoadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

