/**
 * IP Geolocation 테스트 스크립트
 * IP 로그의 국가 정보가 정확하게 표시되는지 확인
 */

import { getIpGeolocation } from '../lib/ip-geolocation'

async function testIpGeolocation() {
  console.log('=== IP Geolocation 테스트 시작 ===\n')

  // 테스트할 IP 주소들
  const testIps = [
    '8.8.8.8', // Google DNS (미국)
    '1.1.1.1', // Cloudflare DNS (호주)
    '127.0.0.1', // 로컬호스트 (null이어야 함)
    '192.168.1.1', // 프라이빗 IP (null이어야 함)
    'unknown', // 알 수 없는 IP (null이어야 함)
  ]

  for (const ip of testIps) {
    console.log(`테스트 IP: ${ip}`)
    try {
      const result = await getIpGeolocation(ip)
      console.log(`  결과:`, result)
      console.log(`  국가: ${result.country || '(null)'}`)
      console.log(`  도시: ${result.city || '(null)'}`)
      console.log(`  국가 코드: ${result.countryCode || '(null)'}`)
    } catch (error) {
      console.error(`  에러:`, error)
    }
    console.log('')
  }

  console.log('=== 테스트 완료 ===')
}

testIpGeolocation().catch(console.error)

