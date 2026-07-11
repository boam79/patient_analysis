/**
 * 전역 샘플 환자 데이터 — 대시보드 / 지도 / 전략 / 필터 패널 공통.
 * 업로드 전(!isDataLoaded)에 필터·KPI·차트가 동일 소스를 쓰도록 한다.
 */
import type { PatientData } from '@/stores/data-store'
import { buildRegionVisitMap } from '@/lib/utils/analysis-helpers'
import {
  generateSamplePatientData,
  SAMPLE_RECORD_COUNT,
  SAMPLE_REGION_COORDS,
} from '@/lib/sample-data-generator'

export {
  SAMPLE_RECORD_COUNT,
  SAMPLE_REGION_COORDS,
  generateSamplePatientData,
} from '@/lib/sample-data-generator'

/** 2024년 전년 방문 샘플 10,000건 (시드 고정) */
export const SAMPLE_PATIENT_DATA: PatientData[] = generateSamplePatientData({
  count: SAMPLE_RECORD_COUNT,
})

export const SAMPLE_DATE_RANGE_LABEL = '2024-01 ~ 2024-12 · 10,000건'

export const SAMPLE_DISEASE_OPTIONS = Array.from(
  new Set(SAMPLE_PATIENT_DATA.map((p) => p.disease_name).filter(Boolean))
).sort()

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
).sort()

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

/** 샘플 전국 분포용 기본 지도 중심 */
export const SAMPLE_MAP_CENTER: [number, number] = [36.45, 127.7]
export const SAMPLE_MAP_ZOOM = 7
