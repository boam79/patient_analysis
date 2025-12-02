/**
 * 관리자 계정 비밀번호 리셋 스크립트
 * 
 * 사용법:
 *   ADMIN_EMAIL=pjm7908@hanmail.net ADMIN_PASSWORD=새비밀번호 tsx scripts/reset-admin-password.ts
 * 
 * 환경 변수:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL (필수)
 *   ADMIN_PASSWORD (필수)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.')
  console.error('필수 환경 변수:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!adminEmail || !adminPassword) {
  console.error('❌ 이메일과 비밀번호를 입력해주세요.')
  console.error('사용법: ADMIN_EMAIL=이메일 ADMIN_PASSWORD=비밀번호 tsx scripts/reset-admin-password.ts')
  process.exit(1)
}

// Service Role Key를 사용하여 Admin API 클라이언트 생성
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function resetPassword() {
  try {
    console.log('🔐 관리자 계정 비밀번호 리셋 중...')
    console.log(`이메일: ${adminEmail}`)

    // 1. 사용자 찾기
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }

    const user = users.find(u => u.email === adminEmail)
    
    if (!user) {
      throw new Error(`이메일 ${adminEmail}에 해당하는 사용자를 찾을 수 없습니다.`)
    }

    console.log(`✅ 사용자 찾음: ${user.id}`)

    // 2. 비밀번호 업데이트
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: adminPassword,
      }
    )

    if (updateError) {
      throw updateError
    }

    console.log('✅ 비밀번호가 성공적으로 업데이트되었습니다!')
    console.log('')
    console.log('📋 업데이트된 계정 정보:')
    console.log(`   이메일: ${adminEmail}`)
    console.log(`   새 비밀번호: ${adminPassword}`)
    console.log('')
    console.log('다음 단계:')
    console.log('   1. http://localhost:3000/login-admin 에서 로그인 테스트')
    console.log('   2. 로그인 성공 후 비밀번호 변경 권장')
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

resetPassword()

