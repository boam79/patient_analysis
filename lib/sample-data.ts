/**
 * 전역 샘플 환자 데이터 — 대시보드 / 지도 / 전략 / 필터 패널 공통.
 * 업로드 전(!isDataLoaded)에 필터·KPI·차트가 동일 소스를 쓰도록 한다.
 */
import type { PatientData } from '@/stores/data-store'
import { buildRegionVisitMap } from '@/lib/utils/analysis-helpers'

const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  '서울 강남구': { lat: 37.5172, lng: 127.0473 },
  '서울 서초구': { lat: 37.4837, lng: 127.0324 },
  '서울 송파구': { lat: 37.5145, lng: 127.1059 },
  '서울 마포구': { lat: 37.5663, lng: 126.9019 },
  '서울 강동구': { lat: 37.5301, lng: 127.1238 },
  '경기 성남시': { lat: 37.4201, lng: 127.1262 },
  '경기 고양시': { lat: 37.6584, lng: 126.832 },
  '경기 용인시': { lat: 37.2411, lng: 127.1776 },
}

function withCoords(
  row: Omit<PatientData, 'latitude' | 'longitude' | 'h3_index'> &
    Partial<Pick<PatientData, 'latitude' | 'longitude' | 'h3_index' | 'surgery_code' | 'surgery_name'>>
): PatientData {
  const coords = REGION_COORDS[row.region]
  return {
    ...row,
    latitude: row.latitude ?? coords?.lat,
    longitude: row.longitude ?? coords?.lng,
    h3_index: row.h3_index ?? (coords ? `sample-${row.region}` : undefined),
  }
}

/** 2024-01 ~ 2024-08 방문 샘플 (전략/대시보드/지도 공통) */
export const SAMPLE_PATIENT_DATA: PatientData[] = [
  withCoords({ patient_id: 'patient_001', name: '홍길동', visit_date: '2024-01-15', age: 45, gender: '남성', disease_code: 'M25.5', disease_name: '무릎관절증', surgery_name: '무릎관절경수술', address: '서울특별시 강남구 테헤란로 123', region: '서울 강남구' }),
  withCoords({ patient_id: 'patient_002', name: '김영희', visit_date: '2024-01-20', age: 52, gender: '여성', disease_code: 'M54.5', disease_name: '척추관협착증', surgery_name: '척추유합술', address: '서울특별시 서초구 서초대로 456', region: '서울 서초구' }),
  withCoords({ patient_id: 'patient_003', name: '이철수', visit_date: '2024-02-10', age: 38, gender: '남성', disease_code: 'I10', disease_name: '본태성 고혈압', address: '서울특별시 송파구 올림픽로 789', region: '서울 송파구' }),
  withCoords({ patient_id: 'patient_001', name: '홍길동', visit_date: '2024-03-05', age: 45, gender: '남성', disease_code: 'M25.5', disease_name: '무릎관절증', address: '서울특별시 강남구 테헤란로 123', region: '서울 강남구' }),
  withCoords({ patient_id: 'patient_004', name: '박민수', visit_date: '2024-02-15', age: 61, gender: '남성', disease_code: 'M75.1', disease_name: '어깨충돌증후군', surgery_name: '어깨관절경수술', address: '경기도 성남시 분당구 정자로 321', region: '경기 성남시' }),
  withCoords({ patient_id: 'patient_005', name: '최지은', visit_date: '2024-02-20', age: 48, gender: '여성', disease_code: 'M51.2', disease_name: '요추추간판장애', address: '서울특별시 마포구 홍대로 654', region: '서울 마포구' }),
  withCoords({ patient_id: 'patient_002', name: '김영희', visit_date: '2024-03-10', age: 52, gender: '여성', disease_code: 'M54.5', disease_name: '척추관협착증', address: '서울특별시 서초구 서초대로 456', region: '서울 서초구' }),
  withCoords({ patient_id: 'patient_006', name: '정수진', visit_date: '2024-03-15', age: 55, gender: '여성', disease_code: 'M80.0', disease_name: '골다공증', address: '서울특별시 강동구 천호대로 987', region: '서울 강동구' }),
  withCoords({ patient_id: 'patient_007', name: '강호영', visit_date: '2024-03-20', age: 42, gender: '남성', disease_code: 'E11.9', disease_name: '당뇨병', address: '경기도 고양시 일산동구 정발산로 147', region: '경기 고양시' }),
  withCoords({ patient_id: 'patient_003', name: '이철수', visit_date: '2024-04-05', age: 38, gender: '남성', disease_code: 'I10', disease_name: '본태성 고혈압', address: '서울특별시 송파구 올림픽로 789', region: '서울 송파구' }),
  withCoords({ patient_id: 'patient_008', name: '윤서연', visit_date: '2024-04-10', age: 49, gender: '여성', disease_code: 'M25.5', disease_name: '무릎관절증', surgery_name: '무릎관절경수술', address: '서울특별시 강남구 테헤란로 258', region: '서울 강남구' }),
  withCoords({ patient_id: 'patient_009', name: '장민호', visit_date: '2024-04-15', age: 58, gender: '남성', disease_code: 'M54.5', disease_name: '척추관협착증', address: '서울특별시 서초구 서초대로 369', region: '서울 서초구' }),
  withCoords({ patient_id: 'patient_001', name: '홍길동', visit_date: '2024-05-01', age: 45, gender: '남성', disease_code: 'M25.5', disease_name: '무릎관절증', address: '서울특별시 강남구 테헤란로 123', region: '서울 강남구' }),
  withCoords({ patient_id: 'patient_010', name: '한소영', visit_date: '2024-05-05', age: 44, gender: '여성', disease_code: 'M75.1', disease_name: '어깨충돌증후군', address: '경기도 용인시 기흥구 신갈로 741', region: '경기 용인시' }),
  withCoords({ patient_id: 'patient_011', name: '오대현', visit_date: '2024-05-10', age: 56, gender: '남성', disease_code: 'M51.2', disease_name: '요추추간판장애', surgery_name: '척추유합술', address: '서울특별시 마포구 홍대로 852', region: '서울 마포구' }),
  withCoords({ patient_id: 'patient_004', name: '박민수', visit_date: '2024-05-15', age: 61, gender: '남성', disease_code: 'M75.1', disease_name: '어깨충돌증후군', address: '경기도 성남시 분당구 정자로 321', region: '경기 성남시' }),
  withCoords({ patient_id: 'patient_012', name: '임지훈', visit_date: '2024-05-20', age: 47, gender: '남성', disease_code: 'I10', disease_name: '본태성 고혈압', address: '서울특별시 송파구 올림픽로 963', region: '서울 송파구' }),
  withCoords({ patient_id: 'patient_013', name: '신미라', visit_date: '2024-06-01', age: 51, gender: '여성', disease_code: 'M80.0', disease_name: '골다공증', address: '서울특별시 강동구 천호대로 159', region: '서울 강동구' }),
  withCoords({ patient_id: 'patient_014', name: '조성민', visit_date: '2024-06-05', age: 39, gender: '남성', disease_code: 'E11.9', disease_name: '당뇨병', address: '경기도 고양시 일산동구 정발산로 357', region: '경기 고양시' }),
  withCoords({ patient_id: 'patient_002', name: '김영희', visit_date: '2024-06-10', age: 52, gender: '여성', disease_code: 'M54.5', disease_name: '척추관협착증', address: '서울특별시 서초구 서초대로 456', region: '서울 서초구' }),
  withCoords({ patient_id: 'patient_015', name: '배혜진', visit_date: '2024-06-15', age: 53, gender: '여성', disease_code: 'M25.5', disease_name: '무릎관절증', surgery_name: '무릎관절경수술', address: '서울특별시 강남구 테헤란로 753', region: '서울 강남구' }),
  withCoords({ patient_id: 'patient_016', name: '류동욱', visit_date: '2024-06-20', age: 46, gender: '남성', disease_code: 'M54.5', disease_name: '척추관협착증', address: '서울특별시 서초구 서초대로 951', region: '서울 서초구' }),
  withCoords({ patient_id: 'patient_003', name: '이철수', visit_date: '2024-07-01', age: 38, gender: '남성', disease_code: 'I10', disease_name: '본태성 고혈압', address: '서울특별시 송파구 올림픽로 789', region: '서울 송파구' }),
  withCoords({ patient_id: 'patient_017', name: '문혜영', visit_date: '2024-07-05', age: 50, gender: '여성', disease_code: 'M75.1', disease_name: '어깨충돌증후군', address: '경기도 용인시 기흥구 신갈로 468', region: '경기 용인시' }),
  withCoords({ patient_id: 'patient_018', name: '송준호', visit_date: '2024-07-10', age: 57, gender: '남성', disease_code: 'M51.2', disease_name: '요추추간판장애', address: '서울특별시 마포구 홍대로 642', region: '서울 마포구' }),
  withCoords({ patient_id: 'patient_001', name: '홍길동', visit_date: '2024-07-15', age: 45, gender: '남성', disease_code: 'M25.5', disease_name: '무릎관절증', address: '서울특별시 강남구 테헤란로 123', region: '서울 강남구' }),
  withCoords({ patient_id: 'patient_019', name: '유나영', visit_date: '2024-07-20', age: 43, gender: '여성', disease_code: 'M80.0', disease_name: '골다공증', address: '서울특별시 강동구 천호대로 825', region: '서울 강동구' }),
  withCoords({ patient_id: 'patient_020', name: '전민석', visit_date: '2024-08-01', age: 48, gender: '남성', disease_code: 'E11.9', disease_name: '당뇨병', address: '경기도 고양시 일산동구 정발산로 147', region: '경기 고양시' }),
]

export const SAMPLE_DATE_RANGE_LABEL = '2024-01 ~ 2024-08'

export const SAMPLE_DISEASE_OPTIONS = Array.from(
  new Set(SAMPLE_PATIENT_DATA.map((p) => p.disease_name).filter(Boolean))
)

export const SAMPLE_REGION_OPTIONS = Array.from(
  new Set(
    SAMPLE_PATIENT_DATA.map((p) => p.region).filter(
      (r): r is string => Boolean(r) && r !== '미분류'
    )
  )
).sort()

export const SAMPLE_SURGERY_OPTIONS = Array.from(
  new Set(
    SAMPLE_PATIENT_DATA.map((p) =>
      p.surgery_name?.toString().trim() || p.surgery_code?.toString().trim() || ''
    ).filter(Boolean)
  )
)

/** 지도용 지역 포인트 (방문 수) */
export function getSampleMapPoints() {
  return buildRegionVisitMap(SAMPLE_PATIENT_DATA)
}

export function isUsingSampleData(
  isDataLoaded: boolean,
  rawData: PatientData[] | undefined
): boolean {
  return !(isDataLoaded && rawData && rawData.length > 0)
}

export function resolveAnalysisData(
  isDataLoaded: boolean,
  rawData: PatientData[] | undefined
): PatientData[] {
  if (isDataLoaded && rawData && rawData.length > 0) return rawData
  return SAMPLE_PATIENT_DATA
}
