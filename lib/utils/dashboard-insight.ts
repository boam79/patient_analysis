export interface DashboardInsightInput {
  recurrenceRate: number
  totalPatients: number
  avgInterval: number
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
  const rateLabel = `${rate.toFixed(1)}%`
  const parts: string[] = [`재방문율 ${rateLabel}`]

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

  return {
    headline: parts.join(' — '),
    detail: input.usingSample
      ? '샘플 기준 요약입니다. 실데이터를 올리면 같은 화면에서 바로 바뀝니다'
      : '필터·지도 클릭으로 근거를 좁혀 보세요',
    ctaLabel: '지역 비교 보기',
    ctaHref: '#more-charts',
  }
}
