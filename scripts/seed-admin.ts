/**
 * 초기 관리자 계정 생성 스크립트
 * 
 * 사용법:
 *   tsx scripts/seed-admin.ts
 * 
 * 환경 변수:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL (선택사항, 기본값: admin@example.com)
 *   ADMIN_PASSWORD (선택사항, 기본값: ChangeMe123!)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.')
  console.error('필수 환경 변수:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
const adminName = process.env.ADMIN_NAME || '관리자'

// Service Role Key를 사용하여 Admin API 클라이언트 생성
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seedAdmin() {
  try {
    console.log('🔐 초기 관리자 계정 생성 중...')
    console.log(`이메일: ${adminEmail}`)
    console.log(`이름: ${adminName}`)

    // 1. Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // 이메일 인증 자동 완료
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  이미 등록된 이메일입니다. 기존 계정을 업데이트합니다...')
        
        // 기존 사용자 조회
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users.find(u => u.email === adminEmail)
        
        if (!existingUser) {
          throw new Error('기존 사용자를 찾을 수 없습니다.')
        }

        // 기존 사용자 프로필 업데이트
        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            role: 'ADMIN',
            is_approved: true,
            name: adminName,
            approved_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id)

        if (updateError) {
          throw updateError
        }

        console.log('✅ 기존 계정이 관리자로 업데이트되었습니다.')
        console.log(`사용자 ID: ${existingUser.id}`)
        return
      }
      throw authError
    }

    if (!authData.user) {
      throw new Error('사용자 생성에 실패했습니다.')
    }

    console.log('✅ Supabase Auth 사용자 생성 완료')
    console.log(`사용자 ID: ${authData.user.id}`)

    // 2. user_profiles 테이블에 프로필 생성
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        name: adminName,
        role: 'ADMIN',
        is_approved: true,
        approved_at: new Date().toISOString(),
      })

    if (profileError) {
      // 프로필 생성 실패 시 Auth 사용자 삭제
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    console.log('✅ 사용자 프로필 생성 완료')
    console.log('')
    console.log('🎉 초기 관리자 계정이 성공적으로 생성되었습니다!')
    console.log('')
    console.log('📋 계정 정보:')
    console.log(`   이메일: ${adminEmail}`)
    console.log(`   비밀번호: ${adminPassword}`)
    console.log(`   역할: ADMIN`)
    console.log('')
    console.log('⚠️  보안을 위해 비밀번호를 변경하세요!')
    console.log('')
    console.log('다음 단계:')
    console.log('   1. http://localhost:3000/login-admin 에서 로그인')
    console.log('   2. 첫 로그인 후 비밀번호 변경 권장')
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

seedAdmin()

