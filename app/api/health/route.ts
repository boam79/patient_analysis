import { NextResponse } from 'next/server'

/**
 * 외부 헬스체크용 — 최소 정보만 노출
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
