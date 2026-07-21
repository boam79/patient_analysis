'use server'

import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/audit'
import { requireAdminAuth, getSupabaseAdmin } from '@/lib/admin-auth'

/**
 * 사용자 승인
 */
export async function approveUser(userId: string) {
  const { userId: adminId } = await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: adminId,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`사용자 승인 실패: ${error.message}`)
  }

  await logAction({
    userId: adminId,
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
  const { userId: adminId } = await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

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
    userId: adminId,
    action: 'user.reject',
    resource: 'user',
    details: { rejected_user_id: userId },
  })

  revalidatePath('/admin/users')
}

/**
 * 활성 ADMIN 수 조회 (마지막 ADMIN 보호용)
 */
async function countActiveAdmins(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const { count, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'ADMIN')
    .eq('is_approved', true)

  if (error) {
    throw new Error(`ADMIN 수 조회 실패: ${error.message}`)
  }

  return count || 0
}

/**
 * 사용자 역할 변경
 */
export async function updateUserRole(
  userId: string,
  newRole: 'ADMIN' | 'ANALYST' | 'VIEWER' | 'USER'
) {
  const { userId: adminId } = await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  if (userId === adminId) {
    throw new Error('자신의 역할은 변경할 수 없습니다.')
  }

  const { data: targetUser } = await supabaseAdmin
    .from('user_profiles')
    .select('role, email, is_approved')
    .eq('id', userId)
    .single()

  if (!targetUser) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  // 마지막 승인 ADMIN을 강등 불가
  if (
    targetUser.role === 'ADMIN' &&
    targetUser.is_approved &&
    newRole !== 'ADMIN'
  ) {
    const adminCount = await countActiveAdmins(supabaseAdmin)
    if (adminCount <= 1) {
      throw new Error('마지막 관리자 계정은 강등할 수 없습니다.')
    }
  }

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    throw new Error(`역할 변경 실패: ${error.message}`)
  }

  await logAction({
    userId: adminId,
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
  const { userId: adminId } = await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  if (userId === adminId) {
    throw new Error('자신의 계정은 삭제할 수 없습니다.')
  }

  const { data: targetUser } = await supabaseAdmin
    .from('user_profiles')
    .select('email, role, is_approved')
    .eq('id', userId)
    .single()

  if (!targetUser) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  // 마지막 승인 ADMIN 삭제 불가
  if (targetUser.role === 'ADMIN' && targetUser.is_approved) {
    const adminCount = await countActiveAdmins(supabaseAdmin)
    if (adminCount <= 1) {
      throw new Error('마지막 관리자 계정은 삭제할 수 없습니다.')
    }
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (authError) {
    throw new Error(`사용자 삭제 실패: ${authError.message}`)
  }

  await logAction({
    userId: adminId,
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
  const { userId: adminId } = await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  if (!email?.includes('@') || password.length < 8) {
    throw new Error('유효한 이메일과 8자 이상 비밀번호가 필요합니다.')
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (authError) {
    throw new Error(`계정 생성 실패: ${authError.message}`)
  }

  if (!authData.user) {
    throw new Error('사용자 생성에 실패했습니다.')
  }

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email,
      name,
      role: 'ADMIN',
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: adminId,
    })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    throw new Error(`프로필 생성 실패: ${profileError.message}`)
  }

  await logAction({
    userId: adminId,
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

/**
 * 사용자 목록 (서버 페이지네이션)
 */
export async function getUsersPage(options: {
  page?: number
  pageSize?: number
  search?: string
  role?: string
  approval?: 'all' | 'approved' | 'pending'
} = {}) {
  await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabaseAdmin
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options.search?.trim()) {
    const q = options.search.trim()
    query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`)
  }
  if (options.role && options.role !== 'all') {
    query = query.eq('role', options.role)
  }
  if (options.approval === 'approved') {
    query = query.eq('is_approved', true)
  } else if (options.approval === 'pending') {
    query = query.eq('is_approved', false)
  }

  const { data, error, count } = await query
  if (error) {
    throw new Error(`사용자 목록 조회 실패: ${error.message}`)
  }

  return {
    users: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
  }
}
