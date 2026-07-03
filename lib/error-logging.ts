'use client'

/**
 * Next.js 에러 바운더리에서 발생한 클라이언트 사이드 에러를 서버(Supabase error_logs)로
 * 전송하는 best-effort 헬퍼. 리포팅 자체의 실패가 에러 화면 렌더링에 영향을 주지 않도록
 * 항상 조용히 실패한다(throw하지 않음).
 *
 * PHI 보호: error.message/stack에는 환자 데이터가 포함되지 않는다는 전제 하에 동작한다
 * (React 컴포넌트 렌더링 에러는 일반적으로 코드 위치/타입 정보만 포함).
 */
export function reportClientError(
  error: Error & { digest?: string },
  boundary: 'app' | 'global' | 'dashboard' | 'admin'
): void {
  if (typeof window === 'undefined') return

  try {
    const payload = JSON.stringify({
      boundary,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      path: window.location.pathname,
    })

    // sendBeacon을 우선 사용 (페이지 이탈 중에도 전송 보장), 미지원 시 fetch로 폴백
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      const sent = navigator.sendBeacon('/api/log-error', blob)
      if (sent) return
    }

    void fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // 리포팅 실패는 무시 (서비스 동작에 영향 없음)
    })
  } catch {
    // 리포팅 자체의 예외도 무시
  }
}
