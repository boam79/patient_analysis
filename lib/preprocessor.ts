import { getICDMapping, getEDIMapping, getAddressCache, saveAddressCache } from './indexeddb'

interface PatientRecord {
  [key: string]: any
}

export interface PreprocessedRecord extends PatientRecord {
  _age_group?: string
  _gender_normalized?: string
  _icd_name?: string
  _surgery_name?: string
  _geocoded?: {
    latitude: number
    longitude: number
    h3Index: string
  }
}

// 생년월일에서 연령대 계산
export function calculateAgeGroup(birthDate: string | number): string {
  try {
    let year: number

    if (typeof birthDate === 'string') {
      // "19850315" 형식 파싱
      if (birthDate.length === 8) {
        year = parseInt(birthDate.substring(0, 4))
      } else if (birthDate.includes('-')) {
        // "1985-03-15" 형식
        year = parseInt(birthDate.split('-')[0])
      } else {
        return '미상'
      }
    } else {
      year = birthDate
    }

    const currentYear = new Date().getFullYear()
    const age = currentYear - year
    
    if (age < 20) return '10대 이하'
    if (age < 30) return '20대'
    if (age < 40) return '30대'
    if (age < 50) return '40대'
    if (age < 60) return '50대'
    if (age < 70) return '60대'
    return '70대 이상'
  } catch (error) {
    return '미상'
  }
}

// 성별 정규화
export function normalizeGender(gender: string | number): string {
  const genderStr = String(gender).toUpperCase().trim()
  
  if (['M', 'MALE', '남', '남성', '1'].includes(genderStr)) {
    return '남성'
  }
  if (['F', 'FEMALE', '여', '여성', '2'].includes(genderStr)) {
    return '여성'
  }
  return '미상'
}

// 주소에서 동·호 제거
export function cleanAddress(address: string): string {
  if (!address) return ''
  
  // 동·호 패턴 제거
  let cleaned = address
    .replace(/\s*\d+동\s*/g, ' ')
    .replace(/\s*\d+호\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  return cleaned
}

// ICD-10 코드 매핑
export async function mapICDCode(code: string): Promise<string | null> {
  if (!code) return null
  
  try {
    const mapping = await getICDMapping(code)
    return mapping?.name || null
  } catch (error) {
    console.error('ICD mapping error:', error)
    return null
  }
}

// EDI 수술 코드 매핑
export async function mapEDICode(code: string): Promise<string | null> {
  if (!code) return null
  
  try {
    const mapping = await getEDIMapping(code)
    return mapping?.name || null
  } catch (error) {
    console.error('EDI mapping error:', error)
    return null
  }
}

// 주소 지오코딩 (캐시 우선)
export async function geocodeAddress(address: string): Promise<{
  latitude: number
  longitude: number
  h3Index: string
} | null> {
  if (!address) return null
  
  const cleanedAddress = cleanAddress(address)
  
  // 캐시 확인
  try {
    const cached = await getAddressCache(cleanedAddress)
    if (cached && Date.now() - cached.timestamp < 30 * 24 * 60 * 60 * 1000) {
      // 30일 이내 캐시 사용
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        h3Index: cached.h3Index,
      }
    }
  } catch (error) {
    console.error('Cache lookup error:', error)
  }
  
  // API 호출 (프록시 경유)
  try {
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: cleanedAddress }),
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    // 캐시 저장
    if (data.latitude && data.longitude && data.h3Index) {
      await saveAddressCache({
        address: cleanedAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        h3Index: data.h3Index,
        timestamp: Date.now(),
      })
      
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        h3Index: data.h3Index,
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }
  
  return null
}

// 데이터 전처리 메인 함수
export async function preprocessData(
  records: PatientRecord[],
  options: {
    mapICD?: boolean
    mapEDI?: boolean
    geocode?: boolean
    onProgress?: (progress: number) => void
  } = {}
): Promise<PreprocessedRecord[]> {
  const {
    mapICD = true,
    mapEDI = true,
    geocode = false, // 기본적으로 지오코딩은 비활성화 (시간 소요)
    onProgress,
  } = options
  
  const results: PreprocessedRecord[] = []
  const total = records.length
  
  for (let i = 0; i < records.length; i++) {
    const record = { ...records[i] }
    
    // 연령대 계산
    if (record.birthDate || record.생년월일 || record.생년) {
      const birthDate = record.birthDate || record.생년월일 || record.생년
      record._age_group = calculateAgeGroup(birthDate)
    }
    
    // 성별 정규화
    if (record.gender || record.성별) {
      const gender = record.gender || record.성별
      record._gender_normalized = normalizeGender(gender)
    }
    
    // ICD-10 매핑
    if (mapICD && (record.icdCode || record.질병코드)) {
      const code = record.icdCode || record.질병코드
      record._icd_name = await mapICDCode(code)
    }
    
    // EDI 수술 코드 매핑
    if (mapEDI && (record.surgeryCode || record.수술코드)) {
      const code = record.surgeryCode || record.수술코드
      record._surgery_name = await mapEDICode(code)
    }
    
    // 주소 지오코딩
    if (geocode && (record.address || record.주소)) {
      const address = record.address || record.주소
      record._geocoded = await geocodeAddress(address)
    }
    
    results.push(record)
    
    // 진행률 업데이트
    if (onProgress && i % 10 === 0) {
      onProgress(Math.round((i / total) * 100))
    }
  }
  
  if (onProgress) {
    onProgress(100)
  }
  
  return results
}

// 데이터 품질 분석
export function analyzeDataQuality(records: PreprocessedRecord[]): {
  totalRecords: number
  missingFields: { [key: string]: number }
  mappingRates: {
    icd: number
    edi: number
    geocode: number
  }
} {
  const total = records.length
  const missingFields: { [key: string]: number } = {}
  let icdMapped = 0
  let ediMapped = 0
  let geocoded = 0
  
  records.forEach((record) => {
    // 필수 필드 누락 확인
    const requiredFields = ['birthDate', '생년월일', 'gender', '성별']
    requiredFields.forEach((field) => {
      if (!record[field]) {
        missingFields[field] = (missingFields[field] || 0) + 1
      }
    })
    
    // 매핑률 계산
    if (record._icd_name) icdMapped++
    if (record._surgery_name) ediMapped++
    if (record._geocoded) geocoded++
  })
  
  return {
    totalRecords: total,
    missingFields,
    mappingRates: {
      icd: total > 0 ? (icdMapped / total) * 100 : 0,
      edi: total > 0 ? (ediMapped / total) * 100 : 0,
      geocode: total > 0 ? (geocoded / total) * 100 : 0,
    },
  }
}

