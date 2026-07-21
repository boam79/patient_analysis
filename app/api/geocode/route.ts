import { NextRequest, NextResponse } from 'next/server'
import { latLngToCell } from 'h3-js'
import { getClientIp, isValidIp } from '@/lib/ip-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 세션 있는 사용자만 (남용·유지보수 우회 완화)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { address } = await request.json()

    if (!address || typeof address !== 'string' || address.length > 500) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    const ipAddress = getClientIp(request)
    const rateLimitKey = isValidIp(ipAddress) ? ipAddress : `user:${user.id}`

    const rateLimit = await checkRateLimit(rateLimitKey, 'geocode', {
      maxRequests: 30,
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

    const nominatimUrl = new URL(
      process.env.NOMINATIM_API_URL ||
        'https://nominatim.openstreetmap.org/search'
    )
    nominatimUrl.searchParams.set('q', address)
    nominatimUrl.searchParams.set('format', 'json')
    nominatimUrl.searchParams.set('limit', '1')
    nominatimUrl.searchParams.set('addressdetails', '1')
    nominatimUrl.searchParams.set('countrycodes', 'kr')

    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent':
          process.env.NOMINATIM_USER_AGENT || 'Hospital-CRM/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Geocoding failed' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    const result = data[0]
    const latitude = parseFloat(result.lat)
    const longitude = parseFloat(result.lon)
    const h3Index = latLngToCell(latitude, longitude, 9)

    return NextResponse.json({
      latitude,
      longitude,
      h3Index,
      displayName: result.display_name,
      address: result.address,
    })
  } catch (error: unknown) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
