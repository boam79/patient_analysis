export interface DashboardInsightInput {
  recurrenceRate: number
  totalPatients: number
  avgInterval: number
  windowSize?: number
  topRegion?: string | null
  topDisease?: string | null
  usingSample?: boolean
  emptyFilter?: boolean
}

export interface DashboardInsight {
  headline: string
  detail?: string
  ctaLabel?: string
  ctaHref?: string
}

/** KPI·Top 항목으로 한 줄 인사이트 생성 (순수 함수) */
export function buildDashboardInsight(input: DashboardInsightInput): DashboardInsight {
  const windowLabel = input.windowSize ? `${input.windowSize}일` : ''

  if (input.emptyFilter) {
    return {
      headline: '필터에 맞는 데이터가 없습니다',
      detail: '칩을 제거하거나 필터를 초기화해 보세요',
      ctaLabel: '필터 초기화',
    }
  }

  if (input.totalPatients === 0) {
    return {
      headline: '분석할 방문 데이터가 없습니다',
      detail: '파일을 업로드하거나 샘플로 먼저 둘러보세요',
      ctaLabel: '데이터 업로드',
      ctaHref: '/dashboard/upload',
    }
  }

  const rate = Number.isFinite(input.recurrenceRate) ? input.recurrenceRate : 0
  const rateLabel = windowLabel
    ? `재방문율 ${rate.toFixed(1)}% (${windowLabel})`
    : `재방문율 ${rate.toFixed(1)}%`
  const parts: string[] = [rateLabel]

  if (input.topRegion && input.topDisease) {
    parts.push(`${input.topRegion}·${input.topDisease}이(가) 견인`)
  } else if (input.topRegion) {
    parts.push(`${input.topRegion} 지역이 두드러짐`)
  } else if (input.topDisease) {
    parts.push(`${input.topDisease} 비중이 높음`)
  }

  if (input.avgInterval > 0) {
    parts.push(`평균 간격 ${Math.round(input.avgInterval)}일`)
  }

  const sampleNote = input.usingSample
    ? '샘플 기준(재방문 간격 대략 14–120일 분포) · 실데이터와 수치가 다를 수 있음'
    : '필터·지도 클릭으로 근거를 좁혀 보세요'

  return {
    headline: parts.join(' — '),
    detail: sampleNote,
    ctaLabel: '지역 비교 보기',
    ctaHref: '#more-charts',
  }
}
