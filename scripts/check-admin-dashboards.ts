/**
 * 제작자 대시보드 데이터 검증 스크립트
 * IP 로그 국가 정보 및 다른 대시보드 값 확인
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
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdminDashboards() {
  console.log('=== 제작자 대시보드 데이터 검증 시작 ===\n')

  // 1. IP 로그 확인
  console.log('1. IP 로그 확인')
  console.log('─'.repeat(50))
  const { data: ipLogs, error: ipError } = await supabase
    .from('ip_access_logs')
    .select('id, ip_address, country, city, path, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (ipError) {
    console.error('IP 로그 조회 에러:', ipError)
  } else {
    console.log(`총 ${ipLogs?.length || 0}개의 최근 IP 로그:`)
    ipLogs?.forEach((log, index) => {
      console.log(`\n  [${index + 1}]`)
      console.log(`    IP: ${log.ip_address}`)
      console.log(`    국가: ${log.country || '(null)'}`)
      console.log(`    도시: ${log.city || '(null)'}`)
      console.log(`    경로: ${log.path}`)
      console.log(`    시간: ${new Date(log.created_at).toLocaleString('ko-KR')}`)
    })

    // 국가 정보가 있는 로그 수
    const logsWithCountry = ipLogs?.filter(log => log.country !== null).length || 0
    const logsWithoutCountry = (ipLogs?.length || 0) - logsWithCountry
    console.log(`\n  통계:`)
    console.log(`    국가 정보 있음: ${logsWithCountry}개`)
    console.log(`    국가 정보 없음: ${logsWithoutCountry}개`)
  }

  // 2. 사용자 관리 확인
  console.log('\n\n2. 사용자 관리 확인')
  console.log('─'.repeat(50))
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, email, name, role, is_approved, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (usersError) {
    console.error('사용자 조회 에러:', usersError)
  } else {
    console.log(`총 ${users?.length || 0}개의 사용자:`)
    users?.forEach((user, index) => {
      console.log(`\n  [${index + 1}]`)
      console.log(`    이메일: ${user.email}`)
      console.log(`    이름: ${user.name || '(null)'}`)
      console.log(`    역할: ${user.role}`)
      console.log(`    승인 상태: ${user.is_approved ? '승인됨' : '대기 중'}`)
      console.log(`    가입일: ${new Date(user.created_at).toLocaleString('ko-KR')}`)
    })

    const approvedUsers = users?.filter(u => u.is_approved).length || 0
    const pendingUsers = (users?.length || 0) - approvedUsers
    console.log(`\n  통계:`)
    console.log(`    승인된 사용자: ${approvedUsers}명`)
    console.log(`    승인 대기: ${pendingUsers}명`)
  }

  // 3. 감사 로그 확인
  console.log('\n\n3. 감사 로그 확인')
  console.log('─'.repeat(50))
  const { data: auditLogs, error: auditError } = await supabase
    .from('audit_logs')
    .select('id, action, resource, user_id, ip_address, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (auditError) {
    console.error('감사 로그 조회 에러:', auditError)
  } else {
    console.log(`총 ${auditLogs?.length || 0}개의 최근 감사 로그:`)
    auditLogs?.forEach((log, index) => {
      console.log(`\n  [${index + 1}]`)
      console.log(`    액션: ${log.action}`)
      console.log(`    리소스: ${log.resource || '(null)'}`)
      console.log(`    사용자 ID: ${log.user_id}`)
      console.log(`    IP 주소: ${log.ip_address || '(null)'}`)
      console.log(`    시간: ${new Date(log.created_at).toLocaleString('ko-KR')}`)
    })
  }

  // 4. 통계 요약
  console.log('\n\n4. 통계 요약')
  console.log('─'.repeat(50))
  
  const [
    { count: totalUsers },
    { count: approvedUsers },
    { count: pendingUsers },
    { count: totalIpLogs },
    { count: totalAuditLogs },
    { count: totalSessions },
  ] = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('ip_access_logs').select('*', { count: 'exact', head: true }),
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
    supabase.from('user_sessions').select('*', { count: 'exact', head: true }),
  ])

  console.log(`총 사용자: ${totalUsers || 0}명`)
  console.log(`  승인된 사용자: ${approvedUsers || 0}명`)
  console.log(`  승인 대기: ${pendingUsers || 0}명`)
  console.log(`총 IP 로그: ${totalIpLogs || 0}개`)
  console.log(`총 감사 로그: ${totalAuditLogs || 0}개`)
  console.log(`총 세션: ${totalSessions || 0}개`)

  // IP 로그 중 국가 정보가 있는 비율
  const { data: ipLogsWithCountry } = await supabase
    .from('ip_access_logs')
    .select('id', { count: 'exact', head: true })
    .not('country', 'is', null)

  const countryInfoRate = totalIpLogs 
    ? ((ipLogsWithCountry?.length || 0) / totalIpLogs * 100).toFixed(1)
    : '0.0'
  console.log(`\nIP 로그 국가 정보 비율: ${countryInfoRate}%`)

  console.log('\n=== 검증 완료 ===')
}

checkAdminDashboards().catch(console.error)

