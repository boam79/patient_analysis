/**
 * IP 통계 Server Actions 테스트 스크립트
 * 실제로 데이터가 반환되는지 확인
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// 환경 변수 로드
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function testIpStatistics() {
  console.log('=== IP 통계 테스트 시작 ===\n')

  // 1. Top IPs 테스트
  console.log('1. Top 10 IPs 테스트')
  console.log('─'.repeat(50))
  const { data: ipLogs, error: ipError } = await supabaseAdmin
    .from('ip_access_logs')
    .select('ip_address')
    .limit(10000)

  if (ipError) {
    console.error('IP 로그 조회 에러:', ipError)
  } else {
    console.log(`총 ${ipLogs?.length || 0}개의 IP 로그 조회됨`)
    
    // 클라이언트 사이드에서 집계
    const ipCounts = new Map<string, number>()
    ipLogs?.forEach(log => {
      if (log.ip_address) {
        ipCounts.set(log.ip_address, (ipCounts.get(log.ip_address) || 0) + 1)
      }
    })

    const topIps = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip_address: ip, access_count: count }))
      .sort((a, b) => b.access_count - a.access_count)
      .slice(0, 10)

    console.log('Top 10 IPs:')
    topIps.forEach((ip, index) => {
      console.log(`  ${index + 1}. ${ip.ip_address}: ${ip.access_count}회`)
    })
  }

  // 2. 경로별 통계 테스트
  console.log('\n\n2. 경로별 통계 테스트')
  console.log('─'.repeat(50))
  const { data: pathLogs, error: pathError } = await supabaseAdmin
    .from('ip_access_logs')
    .select('path, ip_address')
    .limit(10000)

  if (pathError) {
    console.error('경로 로그 조회 에러:', pathError)
  } else {
    console.log(`총 ${pathLogs?.length || 0}개의 경로 로그 조회됨`)
    
    const pathStats = new Map<string, { count: number; uniqueIps: Set<string> }>()
    
    pathLogs?.forEach(log => {
      if (log.path && log.ip_address) {
        if (!pathStats.has(log.path)) {
          pathStats.set(log.path, { count: 0, uniqueIps: new Set() })
        }
        
        const stats = pathStats.get(log.path)!
        stats.count++
        stats.uniqueIps.add(log.ip_address)
      }
    })

    const pathResults = Array.from(pathStats.entries())
      .map(([path, stats]) => ({
        path,
        access_count: stats.count,
        unique_ips: stats.uniqueIps.size,
      }))
      .sort((a, b) => b.access_count - a.access_count)
      .slice(0, 10)

    console.log('Top 10 경로:')
    pathResults.forEach((path, index) => {
      console.log(`  ${index + 1}. ${path.path}: ${path.access_count}회 (고유 IP: ${path.unique_ips}개)`)
    })
  }

  // 3. 시간대별 통계 테스트
  console.log('\n\n3. 시간대별 통계 테스트 (최근 24시간)')
  console.log('─'.repeat(50))
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: hourlyLogs, error: hourlyError } = await supabaseAdmin
    .from('ip_access_logs')
    .select('created_at, ip_address')
    .gte('created_at', oneDayAgo)
    .order('created_at', { ascending: true })

  if (hourlyError) {
    console.error('시간대별 로그 조회 에러:', hourlyError)
  } else {
    console.log(`최근 24시간 내 ${hourlyLogs?.length || 0}개의 로그 조회됨`)
    
    const hourlyStats = new Map<string, { count: number; uniqueIps: Set<string> }>()
    
    hourlyLogs?.forEach(log => {
      if (log.created_at && log.ip_address) {
        const date = new Date(log.created_at)
        const hour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours())
        const hourKey = hour.toISOString()
        
        if (!hourlyStats.has(hourKey)) {
          hourlyStats.set(hourKey, { count: 0, uniqueIps: new Set() })
        }
        
        const stats = hourlyStats.get(hourKey)!
        stats.count++
        stats.uniqueIps.add(log.ip_address)
      }
    })

    const hourlyResults = Array.from(hourlyStats.entries())
      .map(([hour, stats]) => ({
        hour,
        access_count: stats.count,
        unique_ips: stats.uniqueIps.size,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour))

    console.log('시간대별 통계:')
    hourlyResults.forEach(stat => {
      const date = new Date(stat.hour)
      console.log(`  ${date.toLocaleString('ko-KR')}: ${stat.access_count}회 (고유 IP: ${stat.unique_ips}개)`)
    })
  }

  console.log('\n=== 테스트 완료 ===')
}

testIpStatistics().catch(console.error)
















