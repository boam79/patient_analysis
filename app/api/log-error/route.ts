import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isValidIp } from '@/lib/ip-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  }
  return createClient(url, key)
}

const VALID_BOUNDARIES = ['app', 'global', 'dashboard', 'admin']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { boundary, message, stack, digest, path } = body

    if (!message || !VALID_BOUNDARIES.includes(boundary)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const ipAddress = getClientIp(request)

    if (isValidIp(ipAddress)) {
      const rateLimit = await checkRateLimit(ipAddress, 'log-error', {
        maxRequests: 20,
        windowSeconds: 60,
      })
      if (!rateLimit.allowed) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
    }

    const supabaseAdmin = getServiceClient()
    const { error } = await supabaseAdmin.from('error_logs').insert({
      boundary,
      message: String(message).slice(0, 2000),
      stack: stack ? String(stack).slice(0, 8000) : null,
      digest: digest ? String(digest).slice(0, 200) : null,
      path: path ? String(path).slice(0, 500) : null,
      user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
      ip_address: isValidIp(ipAddress) ? ipAddress : null,
    })

    if (error) {
      console.error('error_logs insert failed:', error)
      return NextResponse.json({ error: 'Failed to log' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('log-error route error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
