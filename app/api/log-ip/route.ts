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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, method = 'GET', statusCode = 200, responseTime } = body

    const ipAddress = getClientIp(request)

    if (!isValidIp(ipAddress)) {
      return NextResponse.json(
        { error: 'Invalid IP address' },
        { status: 400 }
      )
    }

    const rateLimit = await checkRateLimit(ipAddress, 'log-ip', {
      maxRequests: 60,
      windowSeconds: 60,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      )
    }

    const userAgent = request.headers.get('user-agent') || null
    const referer = request.headers.get('referer') || null

    void (async () => {
      try {
        const supabaseAdmin = getServiceClient()
        const { error } = await supabaseAdmin.from('ip_access_logs').insert({
          ip_address: ipAddress,
          path: path || '/',
          method,
          user_agent: userAgent,
          referer: referer,
          status_code: statusCode,
          response_time: responseTime,
        })

        if (error) {
          console.error('Failed to log IP access:', error)
        }
      } catch (err: unknown) {
        console.error('IP logging error:', err)
      }
    })()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('IP logging API error:', error)
    return NextResponse.json({ success: false })
  }
}
