import { useEffect, useRef, useCallback, useState } from 'react'

interface DuckDBWorkerMessage {
  type: 'init' | 'query' | 'register' | 'close'
  payload?: any
}

interface DuckDBWorkerResponse {
  type: 'success' | 'error'
  data?: any
  error?: string
}

/**
 * useDuckDBWorker 훅
 * Web Worker를 통한 DuckDB WASM 비동기 처리
 */
export function useDuckDBWorker() {
  const workerRef = useRef<Worker | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Worker 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      workerRef.current = new Worker(new URL('../lib/duckdb-worker.ts', import.meta.url))
      
      workerRef.current.onmessage = (event: MessageEvent<DuckDBWorkerResponse>) => {
        const { type, data, error } = event.data
        
        if (type === 'success' && data === 'DuckDB initialized') {
          setIsInitialized(true)
          setIsLoading(false)
        } else if (type === 'error') {
          setError(error || 'Unknown error')
          setIsLoading(false)
        }
      }

      workerRef.current.onerror = (err) => {
        console.error('[useDuckDBWorker] Worker error:', err)
        setError('Worker initialization failed')
        setIsLoading(false)
      }

      // DuckDB 초기화 요청
      setIsLoading(true)
      workerRef.current.postMessage({ type: 'init' })
    } catch (err: any) {
      console.error('[useDuckDBWorker] Failed to create worker:', err)
      setError(err.message)
      setIsLoading(false)
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'close' })
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  // SQL 쿼리 실행
  const executeQuery = useCallback((query: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }

      const handleMessage = (event: MessageEvent<DuckDBWorkerResponse>) => {
        const { type, data, error } = event.data
        
        if (type === 'success') {
          resolve(data)
        } else {
          reject(new Error(error || 'Query execution failed'))
        }

        workerRef.current?.removeEventListener('message', handleMessage)
      }

      workerRef.current.addEventListener('message', handleMessage)
      workerRef.current.postMessage({ type: 'query', payload: { query } })
    })
  }, [])

  // 데이터 테이블 등록
  const registerTable = useCallback((name: string, data: any[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }

      const handleMessage = (event: MessageEvent<DuckDBWorkerResponse>) => {
        const { type, error } = event.data
        
        if (type === 'success') {
          resolve()
        } else {
          reject(new Error(error || 'Table registration failed'))
        }

        workerRef.current?.removeEventListener('message', handleMessage)
      }

      workerRef.current.addEventListener('message', handleMessage)
      workerRef.current.postMessage({ 
        type: 'register',
        payload: { name, data }
      })
    })
  }, [])

  return {
    isInitialized,
    isLoading,
    error,
    executeQuery,
    registerTable,
  }
}

