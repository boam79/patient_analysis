import type { PatientData } from '@/stores/data-store'
import {
  groupVisitsByPatient,
  resolvePatientId,
} from '@/lib/utils/patient-identity'
import { isReturningWithinWindow } from '@/lib/utils/strategy-metrics'
import { hasSurgery, type RegionMapPoint } from '@/lib/utils/analysis-helpers'
import { normalizeGender, getAgeGroup } from '@/lib/utils/patient-helpers'

export type MapLayerMetric =
  | 'visits'
  | 'unique'
  | 'new'
  | 'returning'
  | 'recurrence_rate'
  | 'disease'
  | 'surgery'
  | 'age'
  | 'gender_male_pct'

export interface MapLayerOptions {
  metric: MapLayerMetric
  windowSize?: number
  /** 단일 또는 복수 질병명 */
  disease?: string | string[]
  /** 단일 또는 복수 수술명/코드 */
  surgery?: string | string[]
  ageGroup?: string
}

export interface MapBasePoint {
  latitude: number
  longitude: number
  region?: string
  h3Index?: string
}

function surgeryKey(p: PatientData): string {
  return (
    p.surgery_name?.toString().trim() ||
    p.surgery_code?.toString().trim() ||
    ''
  )
}

function asList(value?: string | string[]): string[] {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : []
}

function matchesDisease(p: PatientData, diseases: string[]): boolean {
  if (diseases.length === 0) return false
  return diseases.includes(p.disease_name)
}

function matchesSurgery(p: PatientData, surgeries: string[]): boolean {
  if (surgeries.length === 0) return false
  if (!hasSurgery(p)) return false
  const key = surgeryKey(p)
  const code = p.surgery_code?.toString().trim()
  const name = p.surgery_name?.toString().trim()
  return (
    surgeries.includes(key) ||
    (Boolean(name) && surgeries.includes(name!)) ||
    (Boolean(code) && surgeries.includes(code!))
  )
}

function withCoords(
  baseMap: MapBasePoint[],
  regionValues: Map<string, number>
): RegionMapPoint[] {
  // 값이 계산된 지역만 반환 (0으로 채운 미매칭 지역을 그리면 필터가 안 먹는 것처럼 보임)
  return baseMap
    .filter(
      (m) =>
        m.region &&
        m.region !== '미분류' &&
        regionValues.has(m.region) &&
        m.latitude != null &&
        m.longitude != null &&
        !Number.isNaN(m.latitude) &&
        !Number.isNaN(m.longitude)
    )
    .map((m) => ({
      latitude: m.latitude,
      longitude: m.longitude,
      value: regionValues.get(m.region!) ?? 0,
      h3Index: m.h3Index || `region-${m.region}`,
      region: m.region!,
    }))
}

/**
 * 필터된 방문 → 지역별 지도 레이어 값.
 * 데이터가 비면 빈 배열 (샘플 폴백 금지).
 */
export function computeMapLayer(
  rows: PatientData[],
  baseMap: MapBasePoint[],
  options: MapLayerOptions
): RegionMapPoint[] {
  if (!rows.length || !baseMap.length) return []

  const windowSize = options.windowSize ?? 90
  const regionValues = new Map<string, number>()

  if (options.metric === 'visits') {
    rows.forEach((p) => {
      if (!p.region || p.region === '미분류') return
      regionValues.set(p.region, (regionValues.get(p.region) || 0) + 1)
    })
    return withCoords(baseMap, regionValues)
  }

  if (options.metric === 'disease') {
    const diseases = asList(options.disease)
    if (diseases.length === 0) return []
    rows.forEach((p) => {
      if (!matchesDisease(p, diseases)) return
      if (!p.region || p.region === '미분류') return
      regionValues.set(p.region, (regionValues.get(p.region) || 0) + 1)
    })
    return withCoords(baseMap, regionValues)
  }

  if (options.metric === 'surgery') {
    const surgeries = asList(options.surgery)
    if (surgeries.length === 0) return []
    rows.forEach((p) => {
      if (!matchesSurgery(p, surgeries)) return
      if (!p.region || p.region === '미분류') return
      regionValues.set(p.region, (regionValues.get(p.region) || 0) + 1)
    })
    return withCoords(baseMap, regionValues)
  }

  if (options.metric === 'age') {
    rows.forEach((p) => {
      if (!p.region || p.region === '미분류') return
      if (options.ageGroup && getAgeGroup(p.age) !== options.ageGroup) return
      regionValues.set(p.region, (regionValues.get(p.region) || 0) + 1)
    })
    return withCoords(baseMap, regionValues)
  }

  if (options.metric === 'gender_male_pct') {
    const counts = new Map<string, { male: number; total: number }>()
    rows.forEach((p) => {
      if (!p.region || p.region === '미분류') return
      const g = normalizeGender(p.gender)
      if (g !== '남성' && g !== '여성') return
      const cur = counts.get(p.region) || { male: 0, total: 0 }
      if (g === '남성') cur.male++
      cur.total++
      counts.set(p.region, cur)
    })
    counts.forEach((c, region) => {
      regionValues.set(region, c.total > 0 ? (c.male / c.total) * 100 : 0)
    })
    return withCoords(baseMap, regionValues)
  }

  // unique / new / returning / recurrence_rate — 환자×지역 단위
  // (전역 재방문 여부를 모든 방문 지역에 복제하지 않음)
  const byPatient = groupVisitsByPatient(rows)
  const regionUnique = new Map<string, Set<string>>()
  const regionNew = new Map<string, Set<string>>()
  const regionReturning = new Map<string, Set<string>>()

  byPatient.forEach((visits, patientId) => {
    const visitsByRegion = new Map<string, typeof visits>()
    visits.forEach((v) => {
      if (!v.region || v.region === '미분류') return
      if (!visitsByRegion.has(v.region)) visitsByRegion.set(v.region, [])
      visitsByRegion.get(v.region)!.push(v)
    })
    visitsByRegion.forEach((regionVisits, region) => {
      if (!regionUnique.has(region)) regionUnique.set(region, new Set())
      regionUnique.get(region)!.add(patientId)
      if (isReturningWithinWindow(regionVisits, windowSize)) {
        if (!regionReturning.has(region)) regionReturning.set(region, new Set())
        regionReturning.get(region)!.add(patientId)
      } else {
        if (!regionNew.has(region)) regionNew.set(region, new Set())
        regionNew.get(region)!.add(patientId)
      }
    })
  })

  if (options.metric === 'unique') {
    regionUnique.forEach((set, region) => regionValues.set(region, set.size))
  } else if (options.metric === 'new') {
    regionNew.forEach((set, region) => regionValues.set(region, set.size))
  } else if (options.metric === 'returning') {
    regionReturning.forEach((set, region) => regionValues.set(region, set.size))
  } else if (options.metric === 'recurrence_rate') {
    regionUnique.forEach((set, region) => {
      const total = set.size
      const ret = regionReturning.get(region)?.size || 0
      regionValues.set(region, total > 0 ? (ret / total) * 100 : 0)
    })
  }

  return withCoords(baseMap, regionValues)
}

export function surgeryLabel(p: PatientData): string {
  return surgeryKey(p)
}

/** 지역 상세: 윈도우 기준 신환/재환 */
export function computeRegionPatientSplit(
  regionRows: PatientData[],
  windowSize: number
): { unique: number; newPatients: number; returningPatients: number; recurrenceRate: number } {
  const byPatient = groupVisitsByPatient(regionRows)
  let returning = 0
  byPatient.forEach((visits) => {
    if (isReturningWithinWindow(visits, windowSize)) returning++
  })
  const unique = byPatient.size
  return {
    unique,
    newPatients: unique - returning,
    returningPatients: returning,
    recurrenceRate: unique > 0 ? (returning / unique) * 100 : 0,
  }
}

export function resolvePatientKey(p: PatientData): string {
  return resolvePatientId(p)
}
