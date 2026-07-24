/**
 * 경영 인사이트 벤치마크·출처.
 * official = 법령/통계청·복지부·OECD 등 1차 공표
 * literature = 공개 모니터링·연구 사례 (직접 비교 시 주의)
 * operational = 본 제품 운영 휴리스틱 (공적 평가 수치 아님)
 */

export type EvidenceLevel = 'official' | 'literature' | 'operational'

export interface CitedSource {
  id: string
  label: string
  evidenceLevel: EvidenceLevel
  note?: string
}

export const INSIGHT_SOURCES = {
  oecdOutpatient2023: {
    id: 'oecd-outpatient-2023',
    label:
      'OECD Health Statistics / 보건복지부 인용 (2023) — 국민 1인당 연간 외래 진료 18.0회',
    evidenceLevel: 'official' as const,
    note: '전 국민 평균이며 단일 병원 CRM 환자당 방문과 직접 동일시할 수 없음',
  },
  specialtyHospitalRule: {
    id: 'specialty-hospital-rule',
    label:
      '「전문병원의 지정 및 평가 등에 관한 규칙」별표1 — 환자구성비율(관절 MDC I 45%, 척추 MDC I·B05·B60 66%)',
    evidenceLevel: 'official' as const,
    note: '입원·DRG(MDC) 기준. 본 CRM은 방문 행 기준이라 근사 비교만 가능',
  },
  mohwSpecialty2024: {
    id: 'mohw-specialty-2024',
    label:
      '보건복지부 제5기 1차년도 전문병원 지정(2024) — 척추 분야 15개소·관절 25개소 등(연간 운영 109개소)',
    evidenceLevel: 'official' as const,
  },
  kostatElderly2023: {
    id: 'kostat-elderly-2023',
    label: '통계청 「2023 고령자 통계」 — 65세 이상 인구 비중 18.4%',
    evidenceLevel: 'official' as const,
    note: '장기 수요 배경. 월간 환자 성장률(%)의 직접 벤치마크가 아님',
  },
  hiraSpineClinicalMonitor: {
    id: 'hira-spine-clinical-monitor',
    label:
      'HIRA 척추전문병원 임상 질 모니터링(공개 사례) — 수술 후 약 3개월 내 재수술·합병증·재입원',
    evidenceLevel: 'literature' as const,
    note: '전국 일괄 「척추수술 적정성 평가」 방문비중 지표가 아니며, 윈도우 재방문율과 동일 지표가 아님',
  },
  hhiOperational: {
    id: 'hhi-operational',
    label:
      'HHI(지역 환자 점유율 제곱합) — 내부 집중도 휴리스틱 (공정위 병원 규제 임계값 아님)',
    evidenceLevel: 'operational' as const,
  },
  retentionWindowOperational: {
    id: 'retention-window-operational',
    label: '분석 윈도우 내 재방문율 — 내부 운영 경보선',
    evidenceLevel: 'operational' as const,
    note: 'N일 윈도우 재방문 정의. 연간 추적관찰 완료율·COC와 동일하지 않음',
  },
  surgeryVisitShareOperational: {
    id: 'surgery-visit-share-operational',
    label: '수술 필드가 있는 방문 행 비중 — 내부 운영 휴리스틱',
    evidenceLevel: 'operational' as const,
    note: 'HIRA가 권고하는 「방문 대비 수술 비중 %」 공식 지표가 아님',
  },
  visitsIntensityOperational: {
    id: 'visits-intensity-operational',
    label: '관측 기간 환자당 평균 방문·연환산 추정 — 내부 휴리스틱',
    evidenceLevel: 'operational' as const,
  },
  growthMomOperational: {
    id: 'growth-mom-operational',
    label: '월별 고유 환자 수 MoM 변화율 — 내부 운영 경보선',
    evidenceLevel: 'operational' as const,
  },
} satisfies Record<string, CitedSource>

/** 전문병원 지정 규칙상 환자구성비율 (참고용) */
export const SPECIALTY_PATIENT_MIX = {
  jointMdcShareMin: 45,
  spineMdcShareMin: 66,
  source: INSIGHT_SOURCES.specialtyHospitalRule,
}

/** 윈도우 재방문율 운영 경보선 (%). 공적 평균치가 아님. */
export const WINDOW_RETENTION_OPS = {
  criticalBelow: 25,
  warningBelow: 40,
  healthyAtOrAbove: 55,
  source: INSIGHT_SOURCES.retentionWindowOperational,
}

/** MoM 고유환자 성장률 운영 경보선 (%) */
export const MOM_GROWTH_OPS = {
  criticalAtOrBelow: -15,
  warningAtOrBelow: -5,
  healthyAtOrAbove: 2,
  source: INSIGHT_SOURCES.growthMomOperational,
}

/** 수술 방문 행 비중 운영 밴드 (%) */
export const SURGERY_VISIT_SHARE_OPS = {
  lowBelow: 8,
  highAbove: 40,
  source: INSIGHT_SOURCES.surgeryVisitShareOperational,
}

/** 지역 HHI 운영 휴리스틱 (점유율 % 기준 제곱합) */
export const REGION_HHI_OPS = {
  highAbove: 4500,
  diversifiedBelow: 2500,
  source: INSIGHT_SOURCES.hhiOperational,
}

/** 관측 기간 방문 강도 운영선 */
export const VISIT_INTENSITY_OPS = {
  lowAvgVisitsInPeriod: 1.5,
  /** 연환산 방문이 이보다 낮으면 추적 관리 점검 힌트 */
  lowAnnualized: 3,
  /** 연환산이 이 이상이면 「지속성 양호」 정보성 인사이트 */
  sustainedAnnualizedAtOrAbove: 6,
  source: INSIGHT_SOURCES.visitsIntensityOperational,
}

/** 윈도우 기준 신규(미재방문) 비중 운영선 (%) */
export const NEW_PATIENT_SHARE_OPS = {
  highAbove: 70,
  lowBelow: 25,
  minPatientsForLowAlert: 50,
  source: INSIGHT_SOURCES.retentionWindowOperational,
}

export const CONTEXT_FACTS = {
  nationalOutpatientVisitsPerCapita2023: 18.0,
  elderlyShare2023Pct: 18.4,
  spineSpecialtyHospitals2024: 15,
  jointSpecialtyHospitals2024: 25,
}

export function formatSource(source: CitedSource): string {
  return source.note ? `${source.label} ※${source.note}` : source.label
}

export function confidenceFor(level: EvidenceLevel, sampleSize: number): number {
  const base =
    level === 'official' ? 78 : level === 'literature' ? 62 : 58
  const nBoost = Math.min(20, Math.floor(sampleSize / 50) * 2)
  return Math.min(92, base + nBoost)
}

/** UI 표기: 통계적 CI가 아닌 표본 가산 휴리스틱 점수 */
export function confidenceLabel(score: number): string {
  return `표본 가산 점수 ${score}`
}
