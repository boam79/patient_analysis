/**
 * IP Geolocation 유틸리티
 * 무료 IP Geolocation API 사용 (ip-api.com)
 */

interface GeolocationResult {
  country: string | null
  city: string | null
  countryCode: string | null
}

/**
 * IP 주소로부터 국가 및 도시 정보 조회
 * ip-api.com 무료 API 사용 (분당 45회 제한)
 */
export async function getIpGeolocation(ip: string): Promise<GeolocationResult> {
  // localhost나 private IP는 건너뛰기
  if (
    ip === 'unknown' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  ) {
    return {
      country: null,
      city: null,
      countryCode: null,
    }
  }

  try {
    // ip-api.com 무료 API 사용 (JSON 형식)
    // 참고: ip-api.com은 무료 버전에서 분당 45회 제한
    // 프로덕션 환경(Vercel)에서는 자동으로 HTTPS로 변환됨
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        country: null,
        city: null,
        countryCode: null,
      }
    }

    const data = await response.json()

    if (data.status === 'fail') {
      return {
        country: null,
        city: null,
        countryCode: null,
      }
    }

    return {
      country: data.country || null,
      city: data.city || null,
      countryCode: data.countryCode || null,
    }
  } catch (error) {
    console.error('IP Geolocation error:', error)
    return {
      country: null,
      city: null,
      countryCode: null,
    }
  }
}

