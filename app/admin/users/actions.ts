'use server'

import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/audit'
import { requireAdminAuth, getSupabaseAdmin } from '@/lib/admin-auth'
import {
  sanitizeSearchTerm,
  validateAdminPassword,
} from '@/lib/admin-validation'

async function countActiveAdmins(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>
) {
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

function rpcErrorMessage(error: { message?: string } | null): string {
  const msg = error?.message || ''
  // plpgsql RAISE EXCEPTION 메시지 추출
  const m = msg.match(/ERROR:\s*(.+?)(?:\n|$)/i) || msg.match(/exception:\s*(.+)/i)
  return (m?.[1] || msg || '작업 실패').trim()
}

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
 * 사용자 거부 (승인 취소) — self / last-admin 보호
 */
export async function rejectUser(userId: string) {
  const { userId: adminId } = await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  if (userId === adminId) {
    throw new Error('자신의 승인은 취소할 수 없습니다.')
  }

  // 원자 RPC 우선
  const { error: rpcError } = await supabaseAdmin.rpc('admin_safe_reject_user', {
    target_id: userId,
    actor_id: adminId,
  })

  if (rpcError) {
    // RPC 미설치 시 JS 폴백
    if (
      rpcError.message?.includes('Could not find the function') ||
      rpcError.code === 'PGRST202'
    ) {
      const { data: targetUser } = await supabaseAdmin
        .from('user_profiles')
        .select('role, is_approved')
        .eq('id', userId)
        .single()

      if (!targetUser) {
        throw new Error('사용자를 찾을 수 없습니다.')
      }

      if (targetUser.role === 'ADMIN' && targetUser.is_approved) {
        const adminCount = await countActiveAdmins(supabaseAdmin)
        if (adminCount <= 1) {
          throw new Error('마지막 관리자 계정은 승인을 취소할 수 없습니다.')
        }
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
    } else {
      throw new Error(rpcErrorMessage(rpcError))
    }
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

  const { error: rpcError } = await supabaseAdmin.rpc('admin_safe_update_role', {
    target_id: userId,
    actor_id: adminId,
    new_role: newRole,
  })

  if (rpcError) {
    if (
      rpcError.message?.includes('Could not find the function') ||
      rpcError.code === 'PGRST202'
    ) {
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
    } else {
      throw new Error(rpcErrorMessage(rpcError))
    }
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

  const { error: rpcError } = await supabaseAdmin.rpc(
    'admin_safe_precheck_delete',
    {
      target_id: userId,
      actor_id: adminId,
    }
  )

  if (rpcError) {
    if (
      rpcError.message?.includes('Could not find the function') ||
      rpcError.code === 'PGRST202'
    ) {
      if (targetUser.role === 'ADMIN' && targetUser.is_approved) {
        const adminCount = await countActiveAdmins(supabaseAdmin)
        if (adminCount <= 1) {
          throw new Error('마지막 관리자 계정은 삭제할 수 없습니다.')
        }
      }
    } else {
      throw new Error(rpcErrorMessage(rpcError))
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
 * 제작자 계정 생성
 */
export async function createAdminUser(
  email: string,
  password: string,
  name: string
) {
  const { userId: adminId } = await requireAdminAuth()
  const supabaseAdmin = getSupabaseAdmin()

  if (!email?.includes('@')) {
    throw new Error('유효한 이메일이 필요합니다.')
  }

  const passwordError = validateAdminPassword(password)
  if (passwordError) {
    throw new Error(passwordError)
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

  const q = options.search ? sanitizeSearchTerm(options.search) : ''
  if (q) {
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
