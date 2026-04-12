import { NextRequest, NextResponse } from 'next/server'
import { latLngToCell } from 'h3-js'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // OpenStreetMap Nominatim API 호출
    const nominatimUrl = new URL(process.env.NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org/search')
    nominatimUrl.searchParams.set('q', address)
    nominatimUrl.searchParams.set('format', 'json')
    nominatimUrl.searchParams.set('limit', '1')
    nominatimUrl.searchParams.set('addressdetails', '1')
    nominatimUrl.searchParams.set('countrycodes', 'kr')

    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent': process.env.NOMINATIM_USER_AGENT || 'Hospital-CRM/1.0',
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
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    const result = data[0]
    const latitude = parseFloat(result.lat)
    const longitude = parseFloat(result.lon)

    // H3 인덱스 계산 (Resolution 9 = 약 0.1km²)
    const h3Index = latLngToCell(latitude, longitude, 9)

    return NextResponse.json({
      latitude,
      longitude,
      h3Index,
      displayName: result.display_name,
      address: result.address,
    })
  } catch (error: any) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

