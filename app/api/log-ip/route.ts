import { NextResponse } from 'next/server'

/**
 * 공개 IP 로그 엔드포인트는 폐기되었습니다.
 * 접근 로그는 middleware에서 service role로 직접 기록합니다.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Gone',
      message:
        'POST /api/log-ip is disabled. IP logging is handled by middleware only.',
    },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json({ error: 'Gone' }, { status: 410 })
}
