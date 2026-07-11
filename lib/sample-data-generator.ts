/**
 * 결정적(시드) 샘플 방문 데이터 생성기.
 * 번들에 1만 행을 하드코딩하지 않고, 동일 시드로 항상 같은 10,000건을 만든다.
 */
import type { PatientData } from '@/stores/data-store'

export const SAMPLE_RECORD_COUNT = 10_000
export const SAMPLE_GENERATOR_SEED = 20240711

/** 지도용 지역 좌표 (시·군·구 단위) */
export const SAMPLE_REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  '서울 강남구': { lat: 37.5172, lng: 127.0473 },
  '서울 서초구': { lat: 37.4837, lng: 127.0324 },
  '서울 송파구': { lat: 37.5145, lng: 127.1059 },
  '서울 마포구': { lat: 37.5663, lng: 126.9019 },
  '서울 강동구': { lat: 37.5301, lng: 127.1238 },
  '서울 종로구': { lat: 37.5735, lng: 126.9788 },
  '서울 영등포구': { lat: 37.5264, lng: 126.8962 },
  '서울 노원구': { lat: 37.6542, lng: 127.0568 },
  '서울 관악구': { lat: 37.4784, lng: 126.9516 },
  '서울 은평구': { lat: 37.6027, lng: 126.9291 },
  '경기 성남시': { lat: 37.4201, lng: 127.1262 },
  '경기 수원시': { lat: 37.2636, lng: 127.0286 },
  '경기 고양시': { lat: 37.6584, lng: 126.832 },
  '경기 용인시': { lat: 37.2411, lng: 127.1776 },
  '경기 부천시': { lat: 37.5034, lng: 126.766 },
  '경기 안양시': { lat: 37.3943, lng: 126.9568 },
  '경기 화성시': { lat: 37.1995, lng: 126.8312 },
  '경기 남양주시': { lat: 37.636, lng: 127.2165 },
  '인천 남동구': { lat: 37.4471, lng: 126.7315 },
  '인천 연수구': { lat: 37.4101, lng: 126.6783 },
  '인천 부평구': { lat: 37.507, lng: 126.7218 },
  '부산 해운대구': { lat: 35.1631, lng: 129.1635 },
  '부산 부산진구': { lat: 35.1628, lng: 129.0532 },
  '대구 수성구': { lat: 35.858, lng: 128.6306 },
  '대구 달서구': { lat: 35.8298, lng: 128.5326 },
  '광주 서구': { lat: 35.152, lng: 126.8895 },
  '대전 유성구': { lat: 36.3625, lng: 127.3565 },
  '울산 남구': { lat: 35.5437, lng: 129.3301 },
  '강원 춘천시': { lat: 37.8813, lng: 127.73 },
  '충북 청주시': { lat: 36.6424, lng: 127.489 },
  '충남 천안시': { lat: 36.8151, lng: 127.1139 },
  '전북 전주시': { lat: 35.8242, lng: 127.148 },
  '전남 순천시': { lat: 34.9506, lng: 127.4872 },
  '경북 포항시': { lat: 36.019, lng: 129.3435 },
  '경남 창원시': { lat: 35.228, lng: 128.6811 },
  '제주 제주시': { lat: 33.4996, lng: 126.5312 },
}

const REGION_WEIGHTS: Record<string, number> = {
  '서울 강남구': 9,
  '서울 서초구': 6,
  '서울 송파구': 6,
  '서울 마포구': 4,
  '서울 강동구': 4,
  '서울 종로구': 3,
  '서울 영등포구': 4,
  '서울 노원구': 3,
  '서울 관악구': 3,
  '서울 은평구': 3,
  '경기 성남시': 7,
  '경기 수원시': 6,
  '경기 고양시': 5,
  '경기 용인시': 5,
  '경기 부천시': 4,
  '경기 안양시': 3,
  '경기 화성시': 4,
  '경기 남양주시': 3,
  '인천 남동구': 3,
  '인천 연수구': 3,
  '인천 부평구': 2,
  '부산 해운대구': 3,
  '부산 부산진구': 2,
  '대구 수성구': 2,
  '대구 달서구': 2,
  '광주 서구': 2,
  '대전 유성구': 2,
  '울산 남구': 1,
  '강원 춘천시': 1,
  '충북 청주시': 2,
  '충남 천안시': 2,
  '전북 전주시': 2,
  '전남 순천시': 1,
  '경북 포항시': 2,
  '경남 창원시': 2,
  '제주 제주시': 1,
}

const REGION_ADDRESS_PREFIX: Record<string, string> = {
  '서울 강남구': '서울특별시 강남구 테헤란로',
  '서울 서초구': '서울특별시 서초구 서초대로',
  '서울 송파구': '서울특별시 송파구 올림픽로',
  '서울 마포구': '서울특별시 마포구 월드컵로',
  '서울 강동구': '서울특별시 강동구 천호대로',
  '서울 종로구': '서울특별시 종로구 세종대로',
  '서울 영등포구': '서울특별시 영등포구 여의대로',
  '서울 노원구': '서울특별시 노원구 동일로',
  '서울 관악구': '서울특별시 관악구 관악로',
  '서울 은평구': '서울특별시 은평구 통일로',
  '경기 성남시': '경기도 성남시 분당구 판교역로',
  '경기 수원시': '경기도 수원시 영통구 광교중앙로',
  '경기 고양시': '경기도 고양시 일산동구 중앙로',
  '경기 용인시': '경기도 용인시 수지구 포은대로',
  '경기 부천시': '경기도 부천시 원미구 길주로',
  '경기 안양시': '경기도 안양시 동안구 평촌대로',
  '경기 화성시': '경기도 화성시 동탄중앙로',
  '경기 남양주시': '경기도 남양주시 다산중앙로',
  '인천 남동구': '인천광역시 남동구 구월로',
  '인천 연수구': '인천광역시 연수구 송도과학로',
  '인천 부평구': '인천광역시 부평구 부평대로',
  '부산 해운대구': '부산광역시 해운대구 해운대로',
  '부산 부산진구': '부산광역시 부산진구 중앙대로',
  '대구 수성구': '대구광역시 수성구 달구벌대로',
  '대구 달서구': '대구광역시 달서구 월배로',
  '광주 서구': '광주광역시 서구 상무대로',
  '대전 유성구': '대전광역시 유성구 대학로',
  '울산 남구': '울산광역시 남구 삼산로',
  '강원 춘천시': '강원특별자치도 춘천시 중앙로',
  '충북 청주시': '충청북도 청주시 상당구 상당로',
  '충남 천안시': '충청남도 천안시 동남구 만남로',
  '전북 전주시': '전북특별자치도 전주시 완산구 효자로',
  '전남 순천시': '전라남도 순천시 연향로',
  '경북 포항시': '경상북도 포항시 남구 중앙로',
  '경남 창원시': '경상남도 창원시 성산구 중앙대로',
  '제주 제주시': '제주특별자치도 제주시 중앙로',
}

type DiseaseDef = {
  code: string
  name: string
  weight: number
  surgeries: { code: string; name: string }[]
  /** 수술 발생 확률 (0~1) */
  surgeryRate: number
}

/** 척추·관절 중심 + 만성질환 (가중치로 분포) */
const DISEASES: DiseaseDef[] = [
  {
    code: 'M17.9',
    name: '무릎관절증',
    weight: 14,
    surgeryRate: 0.28,
    surgeries: [
      { code: 'N0715', name: '무릎관절경수술' },
      { code: 'N0711', name: '인공슬관절치환술' },
    ],
  },
  {
    code: 'M48.06',
    name: '척추관협착증',
    weight: 12,
    surgeryRate: 0.32,
    surgeries: [
      { code: 'N2072', name: '척추유합술' },
      { code: 'N2073', name: '척추감압술' },
    ],
  },
  {
    code: 'M51.2',
    name: '요추추간판장애',
    weight: 11,
    surgeryRate: 0.22,
    surgeries: [
      { code: 'N1491', name: '추간판제거술' },
      { code: 'N2072', name: '척추유합술' },
    ],
  },
  {
    code: 'M75.1',
    name: '어깨충돌증후군',
    weight: 8,
    surgeryRate: 0.25,
    surgeries: [{ code: 'N0931', name: '어깨관절경수술' }],
  },
  {
    code: 'M80.0',
    name: '골다공증',
    weight: 7,
    surgeryRate: 0.08,
    surgeries: [{ code: 'N0444', name: '척추성형술' }],
  },
  {
    code: 'M25.5',
    name: '관절통',
    weight: 6,
    surgeryRate: 0.05,
    surgeries: [{ code: 'N0715', name: '무릎관절경수술' }],
  },
  {
    code: 'M54.5',
    name: '요통',
    weight: 6,
    surgeryRate: 0.1,
    surgeries: [{ code: 'N2073', name: '척추감압술' }],
  },
  {
    code: 'I10',
    name: '본태성 고혈압',
    weight: 8,
    surgeryRate: 0,
    surgeries: [],
  },
  {
    code: 'E11.9',
    name: '당뇨병',
    weight: 7,
    surgeryRate: 0,
    surgeries: [],
  },
  {
    code: 'M16.1',
    name: '고관절증',
    weight: 5,
    surgeryRate: 0.3,
    surgeries: [{ code: 'N0712', name: '인공고관절치환술' }],
  },
  {
    code: 'S72.0',
    name: '대퇴골경부골절',
    weight: 3,
    surgeryRate: 0.55,
    surgeries: [{ code: 'N0601', name: '골절관혈적정복술' }],
  },
  {
    code: 'G56.0',
    name: '수근관증후군',
    weight: 3,
    surgeryRate: 0.35,
    surgeries: [{ code: 'N0935', name: '수근관감압술' }],
  },
  {
    code: 'M65.3',
    name: '방아쇠수지',
    weight: 2,
    surgeryRate: 0.4,
    surgeries: [{ code: 'N0936', name: '방아쇠수지수술' }],
  },
  {
    code: 'M23.2',
    name: '반월판연골장애',
    weight: 4,
    surgeryRate: 0.4,
    surgeries: [{ code: 'N0715', name: '무릎관절경수술' }],
  },
  {
    code: 'M47.8',
    name: '경추증',
    weight: 4,
    surgeryRate: 0.15,
    surgeries: [{ code: 'N2073', name: '척추감압술' }],
  },
]

const LAST_NAMES = [
  '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
  '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍',
]
const FIRST_A = [
  '민', '서', '지', '예', '하', '도', '은', '수', '현', '준',
  '정', '시', '우', '주', '연', '성', '재', '채', '태', '원',
]
const FIRST_B = [
  '준', '우', '윤', '진', '현', '호', '영', '서', '민', '빈',
  '수', '아', '연', '지', '혁', '성', '훈', '희', '경', '미',
]

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pickWeighted<T extends { weight: number }>(
  items: T[],
  rand: () => number
): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = rand() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

function pickRegion(rand: () => number): string {
  const entries = Object.entries(REGION_WEIGHTS).map(([region, weight]) => ({
    region,
    weight,
  }))
  return pickWeighted(entries, rand).region
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d.getTime())
  n.setDate(n.getDate() + days)
  return n
}

function jitterCoord(base: number, rand: () => number, spread = 0.02): number {
  return base + (rand() - 0.5) * spread
}

export interface GenerateSampleOptions {
  count?: number
  seed?: number
  /** 고유 환자 수 (방문 수는 count) */
  uniquePatients?: number
  startDate?: string
  endDate?: string
}

/**
 * 시드 고정 샘플 생성.
 * 기본: 약 3,500명 × 재방문 포함 = 10,000 방문 행.
 */
export function generateSamplePatientData(
  options: GenerateSampleOptions = {}
): PatientData[] {
  const count = options.count ?? SAMPLE_RECORD_COUNT
  const seed = options.seed ?? SAMPLE_GENERATOR_SEED
  const uniquePatients = options.uniquePatients ?? Math.round(count / 2.85)
  const rand = mulberry32(seed)

  const start = new Date(options.startDate ?? '2024-01-01')
  const end = new Date(options.endDate ?? '2024-12-31')
  const spanMs = Math.max(1, end.getTime() - start.getTime())

  type PatientProfile = {
    patient_id: string
    name: string
    age: number
    gender: '남성' | '여성'
    region: string
    address: string
    disease: DiseaseDef
    primarySurgery: { code: string; name: string } | null
    firstVisit: Date
  }

  const profiles: PatientProfile[] = []
  for (let i = 0; i < uniquePatients; i++) {
    const gender: '남성' | '여성' = rand() < 0.48 ? '남성' : '여성'
    // 척추·관절 병원: 40~75세 비중 높음
    const ageRoll = rand()
    let age: number
    if (ageRoll < 0.08) age = 18 + Math.floor(rand() * 17) // 18-34
    else if (ageRoll < 0.25) age = 35 + Math.floor(rand() * 10) // 35-44
    else if (ageRoll < 0.55) age = 45 + Math.floor(rand() * 15) // 45-59
    else if (ageRoll < 0.85) age = 60 + Math.floor(rand() * 15) // 60-74
    else age = 75 + Math.floor(rand() * 16) // 75-90

    const region = pickRegion(rand)
    const disease = pickWeighted(DISEASES, rand)
    let primarySurgery: { code: string; name: string } | null = null
    if (disease.surgeries.length > 0 && rand() < disease.surgeryRate) {
      primarySurgery =
        disease.surgeries[Math.floor(rand() * disease.surgeries.length)]
    }

    const firstOffset = Math.floor(rand() * spanMs)
    const firstVisit = new Date(start.getTime() + firstOffset)
    const streetNo = 1 + Math.floor(rand() * 400)
    const prefix = REGION_ADDRESS_PREFIX[region] ?? `${region}`

    profiles.push({
      patient_id: `sample_${String(i + 1).padStart(5, '0')}`,
      name: `${LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]}${FIRST_A[Math.floor(rand() * FIRST_A.length)]}${FIRST_B[Math.floor(rand() * FIRST_B.length)]}`,
      age,
      gender,
      region,
      address: `${prefix} ${streetNo}`,
      disease,
      primarySurgery,
      firstVisit,
    })
  }

  // 환자별 방문 횟수 배분 (합 = count)
  const visitCounts = new Array(uniquePatients).fill(1)
  let remaining = count - uniquePatients
  while (remaining > 0) {
    const idx = Math.floor(rand() * uniquePatients)
    // 최대 8회까지 재방문
    if (visitCounts[idx] < 8) {
      visitCounts[idx]++
      remaining--
    } else {
      // 거의 다 찬 경우 아무 환자나 +1 (상한 완화)
      const j = Math.floor(rand() * uniquePatients)
      visitCounts[j]++
      remaining--
    }
  }

  const rows: PatientData[] = []
  for (let i = 0; i < uniquePatients; i++) {
    const profile = profiles[i]
    const visits = visitCounts[i]
    const coords = SAMPLE_REGION_COORDS[profile.region]
    let visitDate = profile.firstVisit

    for (let v = 0; v < visits; v++) {
      if (v > 0) {
        // 14~120일 간격 재방문 (윈도우 분석에 유리)
        const gap = 14 + Math.floor(rand() * 107)
        visitDate = addDays(visitDate, gap)
        if (visitDate > end) {
          visitDate = addDays(end, -Math.floor(rand() * 20))
        }
      }

      const hasSurgeryThisVisit =
        v === 0 && profile.primarySurgery
          ? true
          : profile.primarySurgery && v > 0
            ? rand() < 0.08
            : false

      const surgery = hasSurgeryThisVisit ? profile.primarySurgery : null
      const lat = coords ? jitterCoord(coords.lat, rand) : undefined
      const lng = coords ? jitterCoord(coords.lng, rand) : undefined

      rows.push({
        patient_id: profile.patient_id,
        name: profile.name,
        visit_date: formatDate(visitDate),
        age: profile.age,
        gender: profile.gender,
        disease_code: profile.disease.code,
        disease_name: profile.disease.name,
        surgery_code: surgery?.code,
        surgery_name: surgery?.name,
        address: profile.address,
        region: profile.region,
        latitude: lat,
        longitude: lng,
        h3_index: coords ? `sample-${profile.region}` : undefined,
      })
    }
  }

  // 날짜순 정렬 후 정확히 count개 (배분 오차 대비)
  rows.sort((a, b) => a.visit_date.localeCompare(b.visit_date))
  if (rows.length > count) return rows.slice(0, count)
  while (rows.length < count) {
    const base = rows[rows.length % Math.max(1, rows.length)] ?? profiles[0]
    if (!base) break
    rows.push({
      ...base,
      patient_id: `sample_fill_${rows.length}`,
      visit_date: formatDate(end),
    })
  }
  return rows
}
