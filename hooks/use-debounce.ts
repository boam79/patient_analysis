import { useEffect, useState } from 'react'

/**
 * useDebounce 훅
 * 입력값 변경 시 지정된 지연 시간 후에만 값을 업데이트
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

