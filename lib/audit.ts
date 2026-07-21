/**
 * 감사 로그 헬퍼 함수
 * 모든 중요한 관리자 액션을 audit_logs 테이블에 기록
 */

import { headers } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/admin-auth'

interface LogActionParams {
  userId: string
  action: string
  resource?: string
  details?: Record<string, unknown>
}

/**
 * 감사 로그 기록
 * @param userId - 액션을 수행한 사용자 ID
 * @param action - 액션 타입 (예: 'user.approve', 'user.delete', 'user.create')
 * @param resource - 리소스 타입 (예: 'user', 'permission')
 * @param details - 추가 상세 정보 (JSON)
 */
export async function logAction({
  userId,
  action,
  resource,
  details,
}: LogActionParams) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // 요청 헤더에서 IP 주소 및 User-Agent 추출
    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'unknown'
    const userAgent = headersList.get('user-agent') || null

    // 감사 로그 저장
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action,
      resource,
      details: details || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (error) {
      console.error('Failed to log audit action:', error)
      // 감사 로그 실패가 서비스에 영향 주지 않도록 에러를 throw하지 않음
    }
  } catch (error) {
    console.error('Audit logging error:', error)
    // 감사 로그 실패가 서비스에 영향 주지 않도록 에러를 throw하지 않음
  }
}
