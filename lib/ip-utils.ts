import { NextRequest } from 'next/server'

/**
 * Next.js Request에서 실제 클라이언트 IP 주소 추출
 * 프록시 환경(Vercel, Nginx 등) 고려
 */
export function getClientIp(request: NextRequest): string {
  // 1. X-Forwarded-For 헤더 확인 (프록시가 추가한 IP)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // 첫 번째 IP가 실제 클라이언트 IP (프록시들이 추가한 IP는 쉼표로 구분)
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0]
  }

  // 2. X-Real-IP 헤더 확인 (Nginx 프록시)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // 3. 직접 연결 (개발 환경)
  const remoteAddress = request.headers.get('remote-addr')
  if (remoteAddress) {
    return remoteAddress
  }

  // 4. 기본값 (fallback)
  return 'unknown'
}

/**
 * IP 주소 유효성 검사
 */
export function isValidIp(ip: string): boolean {
  // IPv4 정규식
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 정규식 (간단한 버전)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === 'unknown'
}

