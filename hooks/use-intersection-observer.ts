import { useEffect, useState, RefObject } from 'react'

interface IntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
}

/**
 * useIntersectionObserver 훅
 * 요소가 뷰포트에 들어왔는지 감지
 */
export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: IntersectionObserverOptions = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref, options.threshold, options.root, options.rootMargin])

  return isIntersecting
}

