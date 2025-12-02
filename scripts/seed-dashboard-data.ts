/**
 * 대시보드 테스트 데이터 생성 스크립트
 * 
 * 사용법: npx tsx scripts/seed-dashboard-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDashboardData() {
  console.log('대시보드 테스트 데이터 생성 시작...\n')

  try {
    // 1. 기존 사용자 프로필 조회
    const { data: existingUsers } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(10)

    if (!existingUsers || existingUsers.length === 0) {
      console.log('⚠️  기존 사용자가 없습니다. 먼저 사용자를 생성해주세요.')
      return
    }

    const userIds = existingUsers.map(u => u.id)
    const adminUserId = existingUsers.find(u => u.role === 'ADMIN')?.id || userIds[0]

    console.log(`✓ 기존 사용자 ${existingUsers.length}명 확인`)

    // 2. 테스트 사용자 세션 생성 (최근 30일간)
    console.log('\n📊 사용자 세션 데이터 생성 중...')
    const sessions = []
    const now = new Date()
    
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30)
      const loginAt = new Date(now)
      loginAt.setDate(loginAt.getDate() - daysAgo)
      loginAt.setHours(Math.floor(Math.random() * 24))
      loginAt.setMinutes(Math.floor(Math.random() * 60))

      const sessionDuration = Math.floor(Math.random() * 3600) + 300 // 5분 ~ 1시간
      const logoutAt = new Date(loginAt.getTime() + sessionDuration * 1000)
      const pageViews = Math.floor(Math.random() * 20) + 1

      sessions.push({
        user_id: userIds[Math.floor(Math.random() * userIds.length)],
        login_at: loginAt.toISOString(),
        logout_at: logoutAt.toISOString(),
        session_duration: sessionDuration,
        page_views: pageViews,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: `Mozilla/5.0 (${['Windows', 'Macintosh', 'Linux'][Math.floor(Math.random() * 3)]}; ${['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)]})`,
        is_active: i < 5 ? true : false, // 최근 5개만 활성
        last_activity_at: logoutAt.toISOString(),
        created_at: loginAt.toISOString(),
      })
    }

    const { error: sessionsError } = await supabase
      .from('user_sessions')
      .insert(sessions)

    if (sessionsError) {
      console.error('❌ 세션 데이터 생성 실패:', sessionsError.message)
    } else {
      console.log(`✓ ${sessions.length}개의 세션 데이터 생성 완료`)
    }

    // 3. 감사 로그 생성
    console.log('\n📝 감사 로그 데이터 생성 중...')
    const auditLogs = []
    const actions = [
      'USER_APPROVED',
      'USER_REJECTED',
      'USER_ROLE_UPDATED',
      'USER_CREATED',
      'USER_DELETED',
      'SETTING_UPDATED',
      'MAINTENANCE_MODE_TOGGLED',
    ]

    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor(Math.random() * 7)
      const createdAt = new Date(now)
      createdAt.setDate(createdAt.getDate() - daysAgo)
      createdAt.setHours(Math.floor(Math.random() * 24))
      createdAt.setMinutes(Math.floor(Math.random() * 60))

      const action = actions[Math.floor(Math.random() * actions.length)]
      const targetUserId = userIds[Math.floor(Math.random() * userIds.length)]

      auditLogs.push({
        user_id: adminUserId,
        action: action,
        resource: 'user',
        details: {
          target_user_id: targetUserId,
          reason: '테스트 데이터',
        },
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: `Mozilla/5.0 (Admin Browser)`,
        created_at: createdAt.toISOString(),
      })
    }

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert(auditLogs)

    if (auditError) {
      console.error('❌ 감사 로그 생성 실패:', auditError.message)
    } else {
      console.log(`✓ ${auditLogs.length}개의 감사 로그 생성 완료`)
    }

    // 4. 추가 테스트 사용자 생성 (승인 대기 중)
    console.log('\n👥 테스트 사용자 생성 중...')
    const testUsers = []
    const roles = ['USER', 'ANALYST', 'VIEWER']
    
    for (let i = 0; i < 5; i++) {
      const email = `test-user-${Date.now()}-${i}@example.com`
      const isApproved = Math.random() > 0.5
      
      testUsers.push({
        id: crypto.randomUUID(),
        email: email,
        name: `테스트 사용자 ${i + 1}`,
        role: roles[Math.floor(Math.random() * roles.length)],
        is_approved: isApproved,
        approved_at: isApproved ? new Date().toISOString() : null,
        approved_by: isApproved ? adminUserId : null,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    // Supabase Auth에 사용자 생성은 복잡하므로, user_profiles만 생성
    // 실제로는 Auth API를 통해 사용자를 생성해야 함
    console.log('⚠️  테스트 사용자 생성은 Supabase Auth를 통해 수동으로 생성해야 합니다.')
    console.log('   생성할 사용자 정보:')
    testUsers.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email} (${user.role}, 승인: ${user.is_approved ? '예' : '대기'})`)
    })

    console.log('\n✅ 대시보드 테스트 데이터 생성 완료!')
    console.log('\n📊 생성된 데이터:')
    console.log(`   - 세션: ${sessions.length}개`)
    console.log(`   - 감사 로그: ${auditLogs.length}개`)
    console.log(`   - 테스트 사용자 정보: ${testUsers.length}개 (수동 생성 필요)`)

  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 스크립트 실행
seedDashboardData()
  .then(() => {
    console.log('\n✨ 완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error)
    process.exit(1)
  })

