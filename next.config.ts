import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  
  // 성능 최적화
  reactStrictMode: true,
  
  // 번들 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 실험적 기능
  experimental: {
    optimizePackageImports: ['recharts', 'leaflet'],
  },
  
  // 프로덕션 빌드 최적화
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  
  // 보안 헤더
  async headers() {
    // CSP는 Report-Only로 우선 도입 (v4.6). 실제 위반 여부를 브라우저 콘솔에서
    // 관찰한 뒤 문제가 없으면 Content-Security-Policy(강제 모드)로 전환 예정.
    // Leaflet CSS는 unpkg.com CDN에서, 지도 타일은 tile.openstreetmap.org에서 로드되고,
    // 인증/로그 관련 API는 *.supabase.co로 호출되므로 이를 허용리스트에 포함.
    const cspReportOnly = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://nominatim.openstreetmap.org",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: cspReportOnly,
          },
        ],
      },
    ]
  },
  
  // Webpack 설정
  webpack: (config, { isServer }) => {
    // 클라이언트 사이드에서만 필요한 모듈 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
}

// Bundle Analyzer 설정 (ANALYZE=true npm run build 시 활성화)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
