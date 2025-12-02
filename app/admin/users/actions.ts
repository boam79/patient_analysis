'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAction } from '@/lib/audit'

// Service Role Key를 사용한 Admin 클라이언트
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * 사용자 승인
 */
export async function approveUser(userId: string) {
  const supabase = await createClient()
  
  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  // ADMIN 역할 확인
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 사용자를 승인할 수 있습니다.')
  }

  // 사용자 승인
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`사용자 승인 실패: ${error.message}`)
  }

  // 감사 로그 기록
  await logAction({
    userId: user.id,
    action: 'user.approve',
    resource: 'user',
    details: { approved_user_id: userId },
  })

  revalidatePath('/admin/users')
}

/**
 * 사용자 거부 (승인 취소)
 */
export async function rejectUser(userId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 사용자를 거부할 수 있습니다.')
  }

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({
      is_approved: false,
      approved_at: null,
      approved_by: null,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`사용자 거부 실패: ${error.message}`)
  }

  await logAction({
    userId: user.id,
    action: 'user.reject',
    resource: 'user',
    details: { rejected_user_id: userId },
  })

  revalidatePath('/admin/users')
}

/**
 * 사용자 역할 변경
 */
export async function updateUserRole(userId: string, newRole: 'ADMIN' | 'ANALYST' | 'VIEWER' | 'USER') {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 사용자 역할을 변경할 수 있습니다.')
  }

  // 자신의 역할은 변경할 수 없음
  if (userId === user.id) {
    throw new Error('자신의 역할은 변경할 수 없습니다.')
  }

  const { data: targetUser } = await supabaseAdmin
    .from('user_profiles')
    .select('role, email')
    .eq('id', userId)
    .single()

  if (!targetUser) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    throw new Error(`역할 변경 실패: ${error.message}`)
  }

  await logAction({
    userId: user.id,
    action: 'user.role.update',
    resource: 'user',
    details: {
      target_user_id: userId,
      target_user_email: targetUser.email,
      old_role: targetUser.role,
      new_role: newRole,
    },
  })

  revalidatePath('/admin/users')
}

/**
 * 사용자 삭제
 */
export async function deleteUser(userId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 사용자를 삭제할 수 있습니다.')
  }

  // 자신은 삭제할 수 없음
  if (userId === user.id) {
    throw new Error('자신의 계정은 삭제할 수 없습니다.')
  }

  const { data: targetUser } = await supabaseAdmin
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (!targetUser) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  // Supabase Auth에서 사용자 삭제
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (authError) {
    throw new Error(`사용자 삭제 실패: ${authError.message}`)
  }

  // user_profiles는 CASCADE로 자동 삭제됨

  await logAction({
    userId: user.id,
    action: 'user.delete',
    resource: 'user',
    details: {
      deleted_user_id: userId,
      deleted_user_email: targetUser.email,
    },
  })

  revalidatePath('/admin/users')
}

/**
 * 제작자 계정 생성 (새 관리자 계정)
 */
export async function createAdminUser(
  email: string,
  password: string,
  name: string
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('관리자만 새 계정을 생성할 수 있습니다.')
  }

  // Supabase Auth에 사용자 생성
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // 이메일 인증 자동 완료
  })

  if (authError) {
    throw new Error(`계정 생성 실패: ${authError.message}`)
  }

  if (!authData.user) {
    throw new Error('사용자 생성에 실패했습니다.')
  }

  // user_profiles에 프로필 생성
  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email,
      name,
      role: 'ADMIN',
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })

  if (profileError) {
    // 프로필 생성 실패 시 Auth 사용자 삭제
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    throw new Error(`프로필 생성 실패: ${profileError.message}`)
  }

  await logAction({
    userId: user.id,
    action: 'user.create',
    resource: 'user',
    details: {
      created_user_id: authData.user.id,
      created_user_email: email,
      created_user_name: name,
      role: 'ADMIN',
    },
  })

  revalidatePath('/admin/users')
}

