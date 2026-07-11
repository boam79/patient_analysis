import type { PatientData } from '@/stores/data-store'

export function hasSurgery(
  row: Pick<PatientData, 'surgery_code' | 'surgery_name'>
): boolean {
  const code = row.surgery_code?.toString().trim()
  const name = row.surgery_name?.toString().trim()
  return Boolean(code || name)
}

/** 선형 보간 사분위수 (store·대시보드 공통) */
export function calculateQuartiles(values: number[]): {
  min: number
  q1: number
  median: number
  q3: number
  max: number
} {
  if (values.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0 }
  }
  const sorted = [...values].sort((a, b) => a - b)
  const interpolatedQuantile = (p: number): number => {
    const pos = (sorted.length - 1) * p
    const lower = Math.floor(pos)
    const upper = Math.ceil(pos)
    if (lower === upper) return sorted[lower]
    return sorted[lower] * (upper - pos) + sorted[upper] * (pos - lower)
  }
  return {
    min: sorted[0],
    q1: interpolatedQuantile(0.25),
    median: interpolatedQuantile(0.5),
    q3: interpolatedQuantile(0.75),
    max: sorted[sorted.length - 1],
  }
}

export interface ActiveFilterInput {
  selectedDiseases: string[]
  selectedSurgeries: string[]
  selectedRegions: string[]
  ageGroups: string[]
  genders: string[]
  dateRange: { start: string; end: string }
  windowSize?: number
  defaultWindowSize?: number
}

/** 날짜가 비어 있지 않으면 기간 필터 활성으로 본다 */
export function hasActiveFilters(input: ActiveFilterInput): boolean {
  const dateActive = Boolean(input.dateRange.start && input.dateRange.end)
  const windowActive =
    input.windowSize !== undefined &&
    input.defaultWindowSize !== undefined &&
    input.windowSize !== input.defaultWindowSize

  return (
    input.selectedDiseases.length > 0 ||
    input.selectedSurgeries.length > 0 ||
    input.selectedRegions.length > 0 ||
    input.ageGroups.length > 0 ||
    (input.genders.length > 0 && input.genders.length < 2) ||
    dateActive ||
    windowActive
  )
}

export interface RegionMapPoint {
  latitude: number
  longitude: number
  value: number
  h3Index: string
  region: string
}

/**
 * 필터된 방문으로부터 지역별 방문 수 지도 포인트 생성.
 * 좌표는 행 자체 → baseMap 순으로 보강.
 */
export function buildRegionVisitMap(
  rows: PatientData[],
  baseMap: Array<{
    latitude: number
    longitude: number
    region?: string
    h3Index?: string
  }> = []
): RegionMapPoint[] {
  const regionCounts = new Map<
    string,
    { count: number; lat: number | null; lng: number | null; h3?: string }
  >()

  rows.forEach((p) => {
    if (!p.region || p.region === '미분류') return
    const existing = regionCounts.get(p.region)
    const lat = p.latitude
    const lng = p.longitude
    const hasCoords =
      lat != null &&
      lng != null &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng)

    if (existing) {
      existing.count++
      if (existing.lat == null && hasCoords) {
        existing.lat = lat!
        existing.lng = lng!
        existing.h3 = p.h3_index
      }
    } else {
      regionCounts.set(p.region, {
        count: 1,
        lat: hasCoords ? lat! : null,
        lng: hasCoords ? lng! : null,
        h3: p.h3_index,
      })
    }
  })

  regionCounts.forEach((v, region) => {
    if (v.lat != null && v.lng != null) return
    const base = baseMap.find((m) => m.region === region)
    if (base) {
      v.lat = base.latitude
      v.lng = base.longitude
      v.h3 = base.h3Index
    }
  })

  return Array.from(regionCounts.entries())
    .filter(([, v]) => v.lat != null && v.lng != null)
    .map(([region, v]) => ({
      latitude: v.lat!,
      longitude: v.lng!,
      value: v.count,
      h3Index: v.h3 || `region-${region}`,
      region,
    }))
}
