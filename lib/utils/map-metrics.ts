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
  disease?: string
  surgery?: string
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

function withCoords(
  baseMap: MapBasePoint[],
  regionValues: Map<string, number>
): RegionMapPoint[] {
  return baseMap
    .filter(
      (m) =>
        m.region &&
        m.region !== '미분류' &&
        m.latitude != null &&
        m.longitude != null &&
        !Number.isNaN(m.latitude) &&
        !Number.isNaN(m.longitude)
    )
    .map((m) => ({
      latitude: m.latitude,
      longitude: m.longitude,
      value: regionValues.get(m.region!) || 0,
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
    if (!options.disease) return []
    rows.forEach((p) => {
      if (p.disease_name !== options.disease) return
      if (!p.region || p.region === '미분류') return
      regionValues.set(p.region, (regionValues.get(p.region) || 0) + 1)
    })
    return withCoords(baseMap, regionValues)
  }

  if (options.metric === 'surgery') {
    if (!options.surgery) return []
    rows.forEach((p) => {
      if (!hasSurgery(p)) return
      if (surgeryKey(p) !== options.surgery) return
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

  // unique / new / returning / recurrence_rate — 환자 단위
  const byPatient = groupVisitsByPatient(rows)
  const regionUnique = new Map<string, Set<string>>()
  const regionNew = new Map<string, Set<string>>()
  const regionReturning = new Map<string, Set<string>>()

  byPatient.forEach((visits, patientId) => {
    const returning = isReturningWithinWindow(visits, windowSize)
    const regions = new Set(
      visits
        .map((v) => v.region)
        .filter((r): r is string => Boolean(r) && r !== '미분류')
    )
    regions.forEach((region) => {
      if (!regionUnique.has(region)) regionUnique.set(region, new Set())
      regionUnique.get(region)!.add(patientId)
      if (returning) {
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
