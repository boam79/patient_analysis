/**
 * Service Role Key 확인 스크립트
 * 
 * 이 스크립트는 Service Role Key가 제대로 설정되어 있는지 확인하고,
 * 실제로 데이터를 조회할 수 있는지 테스트합니다.
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('=== Supabase Service Role Key 확인 ===\n')

console.log('1. 환경 변수 확인:')
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ 설정됨' : '❌ 없음'}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ 설정됨' : '❌ 없음'}`)
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? '✅ 설정됨' : '❌ 없음'}\n`)

if (!serviceRoleKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다!')
  console.warn('   ANON_KEY를 사용하면 RLS 정책 때문에 데이터 조회가 실패할 수 있습니다.\n')
}

// Service Role Key로 클라이언트 생성
const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// 테스트 쿼리 실행
async function testQuery() {
  console.log('2. 데이터 조회 테스트:')
  
  try {
    // IP 로그 개수 확인
    const { count, error: countError } = await supabaseAdmin
      .from('ip_access_logs')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('   ❌ IP 로그 개수 조회 실패:', countError.message)
      console.error('   에러 코드:', countError.code)
      console.error('   에러 상세:', countError.details)
      
      if (countError.code === 'PGRST116' || countError.message.includes('RLS')) {
        console.error('\n   ⚠️  RLS 정책 문제로 보입니다!')
        console.error('   Service Role Key를 사용해야 합니다.')
      }
    } else {
      console.log(`   ✅ IP 로그 개수 조회 성공: ${count}개`)
    }
    
    // 실제 데이터 조회 테스트
    const { data, error: dataError } = await supabaseAdmin
      .from('ip_access_logs')
      .select('ip_address')
      .limit(5)
    
    if (dataError) {
      console.error('   ❌ IP 로그 데이터 조회 실패:', dataError.message)
    } else {
      console.log(`   ✅ IP 로그 데이터 조회 성공: ${data?.length || 0}개`)
      if (data && data.length > 0) {
        console.log('   샘플 데이터:', data[0])
      }
    }
    
  } catch (error: any) {
    console.error('   ❌ 테스트 중 오류 발생:', error.message)
  }
}

testQuery().then(() => {
  console.log('\n=== 확인 완료 ===')
  process.exit(0)
}).catch((error) => {
  console.error('\n=== 확인 실패 ===')
  console.error(error)
  process.exit(1)
})

