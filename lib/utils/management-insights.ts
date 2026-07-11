import type { PatientData } from '@/stores/data-store'
import { resolvePatientId } from '@/lib/utils/patient-identity'
import { hasSurgery } from '@/lib/utils/analysis-helpers'
import {
  computeRetentionSummary,
  computeMonthlyUniquePatientGrowth,
  DEFAULT_STRATEGY_WINDOW,
} from '@/lib/utils/strategy-metrics'
import { extractMonth, parseDate } from '@/lib/utils/date-helpers'
import { analyzeTrend } from '@/lib/utils/statistical-insights'
import {
  CONTEXT_FACTS,
  INSIGHT_SOURCES,
  MOM_GROWTH_OPS,
  REGION_HHI_OPS,
  SPECIALTY_PATIENT_MIX,
  SURGERY_VISIT_SHARE_OPS,
  VISIT_INTENSITY_OPS,
  WINDOW_RETENTION_OPS,
  confidenceFor,
  formatSource,
  type EvidenceLevel,
} from '@/lib/utils/management-insight-benchmarks'

export type InsightCategory = 'warning' | 'info' | 'success' | 'critical'
export type InsightPriority = 'high' | 'medium' | 'low'

export interface ManagementInsight {
  id: string
  category: InsightCategory
  priority: InsightPriority
  title: string
  description: string
  recommendations?: string[]
  statisticalBasis: string
  confidence: number
  evidenceLevel: EvidenceLevel
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

/** 관측 기간(월) 추정 — 최소 1개월 */
export function estimateObservationMonths(data: PatientData[]): number {
  let min = Infinity
  let max = -Infinity
  data.forEach((p) => {
    const d = parseDate(p.visit_date)
    if (!d) return
    const t = d.getTime()
    if (t < min) min = t
    if (t > max) max = t
  })
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return 1
  const days = Math.max(1, (max - min) / MS_PER_DAY + 1)
  return Math.max(1, days / 30.44)
}

/** 근골격·척추·관절 관련 방문으로 보이는지 (환자구성비율 근사) */
export function looksMusculoskeletal(p: PatientData): boolean {
  const code = (p.disease_code || '').toUpperCase()
  if (code.startsWith('M') || code.startsWith('S83') || code.startsWith('S13')) {
    return true
  }
  const name = p.disease_name || ''
  return /척추|관절|무릎|어깨|요추|추간판|골다공|협착|충돌|디스크|고관절|근골격/.test(
    name
  )
}

export function buildManagementInsights(
  data: PatientData[],
  windowSize: number = DEFAULT_STRATEGY_WINDOW
): ManagementInsight[] {
  if (!data?.length) return []

  const insights: ManagementInsight[] = []
  const retention = computeRetentionSummary(data, windowSize)
  const uniquePatients = retention.uniquePatients
  const retentionRate = retention.retentionRate
  const avgVisits =
    uniquePatients > 0 ? data.length / uniquePatients : 0
  const obsMonths = estimateObservationMonths(data)
  const annualizedVisits =
    obsMonths > 0 ? avgVisits * (12 / obsMonths) : avgVisits

  const regionPatients = new Map<string, Set<string>>()
  const diseasePatients = new Map<string, Set<string>>()
  let mskPatients = 0

  const patientKeys = new Set<string>()
  data.forEach((p) => {
    const key = resolvePatientId(p)
    patientKeys.add(key)
    if (p.region) {
      if (!regionPatients.has(p.region)) regionPatients.set(p.region, new Set())
      regionPatients.get(p.region)!.add(key)
    }
    if (p.disease_name) {
      if (!diseasePatients.has(p.disease_name)) {
        diseasePatients.set(p.disease_name, new Set())
      }
      diseasePatients.get(p.disease_name)!.add(key)
    }
  })

  // 환자 단위 근골격 여부
  const byPatientMsk = new Map<string, boolean>()
  data.forEach((p) => {
    const key = resolvePatientId(p)
    if (looksMusculoskeletal(p)) byPatientMsk.set(key, true)
    else if (!byPatientMsk.has(key)) byPatientMsk.set(key, false)
  })
  byPatientMsk.forEach((v) => {
    if (v) mskPatients++
  })
  const mskShare =
    uniquePatients > 0 ? (mskPatients / uniquePatients) * 100 : 0

  const regionCounts = Array.from(regionPatients.entries())
    .map(([region, patients]) => ({ region, count: patients.size }))
    .sort((a, b) => b.count - a.count)
  const topRegions = regionCounts.slice(0, 5)

  const diseaseCounts = Array.from(diseasePatients.entries())
    .map(([disease, patients]) => ({ disease, count: patients.size }))
    .sort((a, b) => b.count - a.count)
  const topDiseases = diseaseCounts.slice(0, 5)

  const monthlyVisits = new Map<string, number>()
  data.forEach((p) => {
    const month = extractMonth(p.visit_date)
    if (month) monthlyVisits.set(month, (monthlyVisits.get(month) || 0) + 1)
  })
  const sortedMonths = Array.from(monthlyVisits.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  const monthlyVisitValues = sortedMonths.map(([, count]) => count)
  const growthRate = computeMonthlyUniquePatientGrowth(data)
  const visitTrend = analyzeTrend(monthlyVisitValues.slice(-6))

  const surgeryCount = data.filter((p) => hasSurgery(p)).length
  const surgeryRate = data.length > 0 ? (surgeryCount / data.length) * 100 : 0

  // 1) 윈도우 재방문율 — 운영 휴리스틱만 사용
  const retOps = WINDOW_RETENTION_OPS
  if (retentionRate < retOps.criticalBelow) {
    insights.push({
      id: 'retention-critical',
      category: 'critical',
      priority: 'high',
      title: `재방문율 낮음 (${windowSize}일 윈도우)`,
      description: `${windowSize}일 내 재방문율이 ${retentionRate.toFixed(1)}%입니다. 추적관찰·예약 전환 체계를 점검하세요.`,
      statisticalBasis: `지표 정의: 환자 중 ${windowSize}일 이내 재방문이 1회 이상인 비율. 경보선 ${retOps.criticalBelow}% 미만(운영). ${formatSource(retOps.source)}`,
      confidence: confidenceFor('operational', uniquePatients),
      evidenceLevel: 'operational',
      recommendations: [
        `다음 방문 예약·리마인더를 ${windowSize}일 윈도우에 맞춰 운영`,
        '수술·시술 환자 추적 일정(1·3·6개월 등)은 별도 임상 프로토콜로 관리 — 본 지표와 혼동하지 말 것',
        `참고: ${formatSource(INSIGHT_SOURCES.hiraSpineClinicalMonitor)}`,
      ],
    })
  } else if (retentionRate < retOps.warningBelow) {
    insights.push({
      id: 'retention-warning',
      category: 'warning',
      priority: 'medium',
      title: `재방문율 주의 (${windowSize}일 윈도우)`,
      description: `${windowSize}일 재방문율 ${retentionRate.toFixed(1)}%는 운영 주의선(${retOps.warningBelow}%) 미만입니다.`,
      statisticalBasis: `재방문 ${retention.returningPatients}명 / 고유 ${uniquePatients}명. ${formatSource(retOps.source)}`,
      confidence: confidenceFor('operational', uniquePatients),
      evidenceLevel: 'operational',
      recommendations: [
        '초진 당일 다음 방문 예약률 점검',
        '윈도우 내 미재방문 환자 콜백 목록 운영',
      ],
    })
  } else if (retentionRate >= retOps.healthyAtOrAbove) {
    insights.push({
      id: 'retention-healthy',
      category: 'success',
      priority: 'low',
      title: `재방문율 양호 (${windowSize}일 윈도우)`,
      description: `${windowSize}일 재방문율 ${retentionRate.toFixed(1)}%로 운영 양호선(${retOps.healthyAtOrAbove}%) 이상입니다.`,
      statisticalBasis: `재방문 ${retention.returningPatients}명 / 고유 ${uniquePatients}명. ${formatSource(retOps.source)}`,
      confidence: confidenceFor('operational', uniquePatients),
      evidenceLevel: 'operational',
      recommendations: ['윈도우별 재방문율을 분기 단위로 추세 관리'],
    })
  }

  // 2) MoM 성장 — 운영선 + 고령화는 배경만
  const gOps = MOM_GROWTH_OPS
  if (sortedMonths.length >= 2) {
    if (growthRate <= gOps.criticalAtOrBelow) {
      insights.push({
        id: 'growth-critical',
        category: 'critical',
        priority: 'high',
        title: '월간 고유 환자 급감',
        description: `전월 대비 고유 환자 ${growthRate.toFixed(1)}% 변화입니다. 단기 유입·이탈을 점검하세요.`,
        statisticalBasis: `MoM 고유환자 변화율. 경보 ${gOps.criticalAtOrBelow}% 이하(운영). 배경: ${formatSource(INSIGHT_SOURCES.kostatElderly2023)}. ${formatSource(gOps.source)}`,
        confidence: confidenceFor('operational', uniquePatients),
        evidenceLevel: 'operational',
        recommendations: [
          '최근 2개월 채널별 신규 유입·전원 경로 확인',
          '고령화로 장기 수요는 증가 배경이나, MoM %를 연간 인구 성장과 동일시하지 말 것',
        ],
      })
    } else if (growthRate <= gOps.warningAtOrBelow) {
      insights.push({
        id: 'growth-warning',
        category: 'warning',
        priority: 'medium',
        title: '월간 고유 환자 감소',
        description: `전월 대비 ${growthRate.toFixed(1)}%. 운영 주의선(${gOps.warningAtOrBelow}%) 이하입니다.`,
        statisticalBasis: `MoM 고유환자. ${formatSource(gOps.source)}. 배경 ${INSIGHT_SOURCES.kostatElderly2023.label}`,
        confidence: confidenceFor('operational', uniquePatients),
        evidenceLevel: 'operational',
        recommendations: ['신규 유입 채널·대기 시간·경쟁 환경 점검'],
      })
    } else if (growthRate >= gOps.healthyAtOrAbove) {
      insights.push({
        id: 'growth-healthy',
        category: 'success',
        priority: 'low',
        title: '월간 고유 환자 증가',
        description: `전월 대비 +${growthRate.toFixed(1)}%로 운영 양호선(${gOps.healthyAtOrAbove}% MoM) 이상입니다.`,
        statisticalBasis: `MoM 고유환자. ${formatSource(gOps.source)}`,
        confidence: confidenceFor('operational', uniquePatients),
        evidenceLevel: 'operational',
        recommendations: ['수용 역량(진료·수술 슬롯) 대비 점검'],
      })
    }
  }

  // 3) 방문 추세 (데이터 내 회귀)
  if (
    visitTrend.direction !== 'stable' &&
    visitTrend.strength !== 'weak' &&
    sortedMonths.length >= 4
  ) {
    insights.push({
      id: 'trend-analysis',
      category: visitTrend.direction === 'increasing' ? 'info' : 'warning',
      priority: visitTrend.strength === 'strong' ? 'medium' : 'low',
      title: `${visitTrend.direction === 'increasing' ? '상승' : '하락'} 추세 (최근 월별 방문)`,
      description: visitTrend.description,
      statisticalBasis: `관측 구간 선형 회귀(내부). 공적 벤치마크 대비가 아님`,
      confidence: confidenceFor('operational', sortedMonths.length * 10),
      evidenceLevel: 'operational',
      recommendations:
        visitTrend.direction === 'increasing'
          ? ['성수기·수용 역량 점검']
          : ['계절성·필터·데이터 기간 왜곡 여부 확인'],
    })
  }

  // 4) 방문 강도 — 기간 평균 + 연환산 (국민 18회와 직접 동일시 금지)
  const vOps = VISIT_INTENSITY_OPS
  if (avgVisits < vOps.lowAvgVisitsInPeriod) {
    insights.push({
      id: 'avg-visits-low',
      category: 'info',
      priority: 'medium',
      title: '환자당 방문 강도 낮음',
      description: `관측 ${obsMonths.toFixed(1)}개월 동안 환자당 평균 ${avgVisits.toFixed(2)}회(연환산 약 ${annualizedVisits.toFixed(1)}회).`,
      statisticalBasis: `기간 평균 방문·연환산=평균×(12/관측월). ${formatSource(vOps.source)}. 참고(다른 모집단): ${formatSource(INSIGHT_SOURCES.oecdOutpatient2023)}`,
      confidence: confidenceFor('operational', uniquePatients),
      evidenceLevel: 'operational',
      recommendations: [
        '단기간 데이터면 연환산이 과소/과대될 수 있음 — 관측 기간을 함께 제시',
        '국민 1인당 외래 18.0회는 전 국민·전 진료과 평균이라 병원 CRM과 직접 비교하지 말 것',
      ],
    })
  } else if (annualizedVisits >= 6) {
    insights.push({
      id: 'avg-visits-sustained',
      category: 'success',
      priority: 'low',
      title: '환자당 방문 지속성 양호(연환산)',
      description: `관측 ${obsMonths.toFixed(1)}개월 평균 ${avgVisits.toFixed(2)}회 → 연환산 약 ${annualizedVisits.toFixed(1)}회.`,
      statisticalBasis: `${formatSource(vOps.source)}`,
      confidence: confidenceFor('operational', uniquePatients),
      evidenceLevel: 'operational',
    })
  }

  // 5) 수술 방문 행 비중 — HIRA 권고라고 쓰지 않음
  const sOps = SURGERY_VISIT_SHARE_OPS
  if (surgeryRate > sOps.highAbove) {
    insights.push({
      id: 'surgery-rate-high',
      category: 'warning',
      priority: 'medium',
      title: '수술 표기 방문 비중 높음',
      description: `방문 행의 ${surgeryRate.toFixed(1)}%에 수술 필드가 있습니다(운영 상한 ${sOps.highAbove}%).`,
      statisticalBasis: `수술 ${surgeryCount} / 방문 ${data.length}. ${formatSource(sOps.source)}. 임상 질은 별도: ${INSIGHT_SOURCES.hiraSpineClinicalMonitor.label}`,
      confidence: confidenceFor('operational', data.length),
      evidenceLevel: 'operational',
      recommendations: [
        '수술 적응·보존 치료 선행은 임상 프로토콜·청구 데이터로 별도 감사',
        '본 %는 HIRA 공식 「적정 수술 비중」이 아님',
      ],
    })
  } else if (surgeryRate < sOps.lowBelow && data.length >= 20) {
    insights.push({
      id: 'surgery-rate-low',
      category: 'info',
      priority: 'low',
      title: '수술 표기 방문 비중 낮음',
      description: `수술 필드 방문 비중 ${surgeryRate.toFixed(1)}%(운영 하한 ${sOps.lowBelow}% 미만).`,
      statisticalBasis: `${formatSource(sOps.source)}. 전문병원 지정은 환자구성·진료량 등 별도 기준: ${INSIGHT_SOURCES.specialtyHospitalRule.label}`,
      confidence: confidenceFor('operational', data.length),
      evidenceLevel: 'operational',
      recommendations: [
        '수술 필드 누락(코딩) 여부 확인',
        `지정 현황 참고: ${INSIGHT_SOURCES.mohwSpecialty2024.label}`,
      ],
    })
  } else if (data.length >= 20) {
    insights.push({
      id: 'surgery-rate-mid',
      category: 'info',
      priority: 'low',
      title: '수술 표기 방문 비중(참고)',
      description: `수술 필드 방문 비중 ${surgeryRate.toFixed(1)}% (운영 밴드 ${sOps.lowBelow}~${sOps.highAbove}%).`,
      statisticalBasis: `${formatSource(sOps.source)}`,
      confidence: confidenceFor('operational', data.length),
      evidenceLevel: 'operational',
    })
  }

  // 6) 지역 집중도 — HHI 공식만, 공정위 병원 기준 주장 금지
  const hhiOps = REGION_HHI_OPS
  if (topRegions.length > 0 && uniquePatients > 0) {
    const regionShares = regionCounts.map(
      (r) => (r.count / uniquePatients) * 100
    )
    const hhiValue = regionShares.reduce((sum, share) => sum + share * share, 0)
    const topShare = (topRegions[0].count / uniquePatients) * 100

    if (hhiValue > hhiOps.highAbove) {
      insights.push({
        id: 'market-concentration-high',
        category: 'warning',
        priority: 'medium',
        title: '지역 환자 집중도 높음',
        description: `${topRegions[0].region} ${topShare.toFixed(1)}%. 유입 지역 다변화가 필요할 수 있습니다.`,
        statisticalBasis: `HHI=${hhiValue.toFixed(0)} (점유율% 제곱합). ${formatSource(hhiOps.source)}`,
        confidence: confidenceFor('operational', uniquePatients),
        evidenceLevel: 'operational',
        recommendations: ['인접 권역 유입·협력 진료 네트워크 점검'],
      })
    } else if (hhiValue < hhiOps.diversifiedBelow && regionCounts.length >= 5) {
      insights.push({
        id: 'market-diversified',
        category: 'success',
        priority: 'low',
        title: '지역 유입 다각화',
        description: `${regionCounts.length}개 지역, 1위 ${topRegions[0].region}(${topShare.toFixed(1)}%).`,
        statisticalBasis: `HHI=${hhiValue.toFixed(0)}. ${formatSource(hhiOps.source)}`,
        confidence: confidenceFor('operational', uniquePatients),
        evidenceLevel: 'operational',
      })
    }
  }

  // 7) 질환 포트폴리오 — 실제 지정 규칙 환자구성비율 인용
  if (topDiseases.length > 0 && uniquePatients > 0) {
    const topShare = (topDiseases[0].count / uniquePatients) * 100
    const top3 =
      diseaseCounts
        .slice(0, 3)
        .reduce((sum, d) => sum + (d.count / uniquePatients) * 100, 0)

    insights.push({
      id: 'disease-portfolio',
      category: 'info',
      priority: 'medium',
      title: '주요 질환 포트폴리오',
      description: `1위 ${topDiseases[0].disease}(${topShare.toFixed(1)}%), Top3 ${top3.toFixed(1)}%. 근골격·척추·관절로 분류된 환자 약 ${mskShare.toFixed(1)}%.`,
      statisticalBasis: `방문 기반 근사. 전문병원 지정 환자구성비율(입원 MDC): 관절 ${SPECIALTY_PATIENT_MIX.jointMdcShareMin}%·척추 ${SPECIALTY_PATIENT_MIX.spineMdcShareMin}% — ${formatSource(SPECIALTY_PATIENT_MIX.source)}. ${INSIGHT_SOURCES.mohwSpecialty2024.label}`,
      confidence: confidenceFor('official', uniquePatients) - 8,
      evidenceLevel: 'official',
      recommendations: [
        '인증 갱신·지정 심사는 청구·MDC 기준으로 별도 산출 필요',
        '본 CRM 질병명 집계는 지정 심사 대체 지표가 아님',
      ],
    })
  }

  // 8) 신규(윈도우 미재방문) 비율
  const newRate =
    uniquePatients > 0 ? (retention.newPatients / uniquePatients) * 100 : 0
  if (newRate > 70) {
    insights.push({
      id: 'new-patient-high',
      category: 'warning',
      priority: 'medium',
      title: '윈도우 기준 신규(미재방문) 비중 높음',
      description: `${windowSize}일 미재방문 환자 ${newRate.toFixed(1)}%. 초진→재방문 전환을 점검하세요.`,
      statisticalBasis: `신규(윈도우 미재방문) ${retention.newPatients} / 고유 ${uniquePatients}. ${formatSource(WINDOW_RETENTION_OPS.source)}`,
      confidence: confidenceFor('operational', uniquePatients),
      evidenceLevel: 'operational',
      recommendations: [
        '초진 당일 다음 방문 예약률',
        '단기간 데이터면 신규 비중이 높게 나올 수 있음',
      ],
    })
  } else if (newRate < 25 && uniquePatients > 50) {
    insights.push({
      id: 'new-patient-low',
      category: 'warning',
      priority: 'medium',
      title: '신규 유입 비중 낮음',
      description: `윈도우 기준 신규 ${newRate.toFixed(1)}%. 기존 환자 의존도가 높을 수 있습니다.`,
      statisticalBasis: `배경 수요: ${INSIGHT_SOURCES.kostatElderly2023.label} (65세+ ${CONTEXT_FACTS.elderlyShare2023Pct}%)`,
      confidence: confidenceFor('operational', uniquePatients),
      evidenceLevel: 'operational',
      recommendations: ['신규 유입 채널·1차 의료기관 연계 점검'],
    })
  }

  const priorityOrder: Record<InsightPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  }
  const categoryOrder: Record<InsightCategory, number> = {
    critical: 4,
    warning: 3,
    info: 2,
    success: 1,
  }

  return insights.sort((a, b) => {
    if (priorityOrder[a.priority] === priorityOrder[b.priority]) {
      return categoryOrder[b.category] - categoryOrder[a.category]
    }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}
