'use client'

import { useEffect } from 'react'
import { reportClientError } from '@/lib/error-logging'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error Boundary]', error)
    reportClientError(error, 'global')
  }, [error])

  return (
    <html lang="ko">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
        }}
      >
        <div
          style={{
            maxWidth: '28rem',
            width: '100%',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              margin: '0 auto 1rem',
              display: 'flex',
              height: '3rem',
              width: '3rem',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              backgroundColor: '#fee2e2',
              fontSize: '1.5rem',
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            애플리케이션에 심각한 오류가 발생했습니다
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
            병원 CRM을 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 다시 시도해 주세요.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.375rem',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
