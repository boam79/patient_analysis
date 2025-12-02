import { UAParser } from 'ua-parser-js'

/**
 * User-Agent 문자열에서 디바이스 정보 추출
 */
export interface DeviceInfo {
  device: string | null
  browser: string | null
  os: string | null
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
}

export function parseUserAgent(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return {
      device: null,
      browser: null,
      os: null,
      deviceType: 'unknown',
    }
  }

  const parser = new UAParser(userAgent)
  const result = parser.getResult()

  // 디바이스 타입 결정
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown'
  if (result.device.type === 'mobile') {
    deviceType = 'mobile'
  } else if (result.device.type === 'tablet') {
    deviceType = 'tablet'
  } else {
    deviceType = 'desktop'
  }

  // 디바이스 이름 구성
  const deviceParts: string[] = []
  if (result.device.vendor) {
    deviceParts.push(result.device.vendor)
  }
  if (result.device.model) {
    deviceParts.push(result.device.model)
  }
  const device = deviceParts.length > 0 ? deviceParts.join(' ') : null

  // 브라우저 이름 구성
  const browserParts: string[] = []
  if (result.browser.name) {
    browserParts.push(result.browser.name)
  }
  if (result.browser.version) {
    browserParts.push(result.browser.version)
  }
  const browser = browserParts.length > 0 ? browserParts.join(' ') : null

  // OS 이름 구성
  const osParts: string[] = []
  if (result.os.name) {
    osParts.push(result.os.name)
  }
  if (result.os.version) {
    osParts.push(result.os.version)
  }
  const os = osParts.length > 0 ? osParts.join(' ') : null

  return {
    device,
    browser,
    os,
    deviceType,
  }
}

/**
 * 디바이스 타입을 한글로 변환
 */
export function getDeviceTypeLabel(deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'): string {
  switch (deviceType) {
    case 'desktop':
      return '데스크톱'
    case 'mobile':
      return '모바일'
    case 'tablet':
      return '태블릿'
    default:
      return '알 수 없음'
  }
}

