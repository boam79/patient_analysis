/**
 * 고급 통계·시계열·생존 분석 유틸 (클라이언트 안전, 외부 라이브러리 없음)
 * 관찰 데이터 전제 — 인과 해석 금지 문구는 UI에서 병행 표기
 */

/** Wilson score 신뢰구간 (이항 비율, 95% 기본) */
export function wilsonScoreInterval(
  successes: number,
  trials: number,
  confidence = 0.95
): { low: number; high: number; center: number } {
  if (trials <= 0) return { low: 0, high: 1, center: 0 }
  const z =
    confidence >= 0.99
      ? 2.576
      : confidence >= 0.95
        ? 1.96
        : 1.645
  const phat = Math.min(1, Math.max(0, successes / trials))
  const denom = 1 + (z * z) / trials
  const center = (phat + (z * z) / (2 * trials)) / denom
  const half =
    (z * Math.sqrt((phat * (1 - phat)) / trials + (z * z) / (4 * trials * trials))) / denom
  return {
    center,
    low: Math.max(0, center - half),
    high: Math.min(1, center + half),
  }
}

/** 두 비율 차이 Cohen's h (효과 크기) */
export function cohensH(p1: number, p2: number): number {
  const clamp = (p: number) => Math.min(0.999, Math.max(0.001, p))
  const h = (p: number) => 2 * Math.asin(Math.sqrt(clamp(p)))
  return h(p1) - h(p2)
}

/**
 * Benjamini–Hochberg FDR (거절 규칙).
 * 정렬된 p 중 P(i) ≤ (q·i)/m 인 최대 i까지의 가설을 유의로 표시.
 */
export function benjaminiHochbergReject(pValues: number[], q = 0.1): boolean[] {
  const m = pValues.length
  if (m === 0) return []
  const order = pValues.map((p, i) => ({ p: Math.min(1, Math.max(1e-15, p)), i }))
  order.sort((a, b) => a.p - b.p)
  let maxI = 0
  for (let rank = 1; rank <= m; rank++) {
    if (order[rank - 1].p <= (q * rank) / m) maxI = rank
  }
  const reject = new Set(order.slice(0, maxI).map((o) => o.i))
  return pValues.map((_, i) => reject.has(i))
}

/**
 * 표준정규 양측 p-value 근사 (Abramowitz & Stegun 7.1.26 계열)
 * P(|Z| > |z|) ≈ 2 * (1 - Φ(|z|))
 */
export function twoSidedNormalP(z: number): number {
  const x = Math.abs(z)
  if (x === 0) return 1
  const t = 1 / (1 + 0.2316419 * x)
  const d = 0.3989423 * Math.exp((-x * x) / 2)
  const tail =
    d *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return Math.min(1, Math.max(0, 2 * tail))
}

/** 간단 가법 STL: 추세(중심 MA) + 계절(달 평균) + 잔차 */
export function classicalSTL(
  values: number[],
  calendarMonths: number[],
  trendWindow: number
): { trend: number[]; seasonal: number[]; residual: number[] } {
  const n = values.length
  if (n === 0) return { trend: [], seasonal: [], residual: [] }
  const w = Math.max(3, Math.min(trendWindow, n % 2 === 0 ? n - 1 : n))
  const half = Math.floor(w / 2)
  const trend = values.map((_, i) => {
    const lo = Math.max(0, i - half)
    const hi = Math.min(n, i + half + 1)
    const slice = values.slice(lo, hi)
    return slice.reduce((s, v) => s + v, 0) / slice.length
  })
  const detrend = values.map((v, i) => v - trend[i])
  const monthBuckets: Record<number, number[]> = {}
  calendarMonths.forEach((mo, i) => {
    if (!monthBuckets[mo]) monthBuckets[mo] = []
    monthBuckets[mo].push(detrend[i])
  })
  const monthSeason: Record<number, number> = {}
  for (let mo = 1; mo <= 12; mo++) {
    const arr = monthBuckets[mo] ?? [0]
    monthSeason[mo] = arr.reduce((s, v) => s + v, 0) / arr.length
  }
  const meanSeason =
    Object.values(monthSeason).reduce((s, v) => s + v, 0) / 12
  const seasonal = calendarMonths.map((mo) => monthSeason[mo] - meanSeason)
  const residual = values.map((v, i) => v - trend[i] - seasonal[i])
  return { trend, seasonal, residual }
}

/** 단일 변화점(평균 변화) 이진 분할 */
export function singleChangePoint(values: number[]): {
  index: number
  beforeMean: number
  afterMean: number
  reductionSSE: number
} | null {
  const n = values.length
  if (n < 6) return null
  let best = { index: 0, reductionSSE: -1, beforeMean: 0, afterMean: 0 }
  const totalMean = values.reduce((s, v) => s + v, 0) / n
  const totalSSE = values.reduce((s, v) => s + (v - totalMean) ** 2, 0)
  for (let k = 3; k <= n - 3; k++) {
    const left = values.slice(0, k)
    const right = values.slice(k)
    const mL = left.reduce((s, v) => s + v, 0) / left.length
    const mR = right.reduce((s, v) => s + v, 0) / right.length
    const sseL = left.reduce((s, v) => s + (v - mL) ** 2, 0)
    const sseR = right.reduce((s, v) => s + (v - mR) ** 2, 0)
    const reduction = totalSSE - (sseL + sseR)
    if (reduction > best.reductionSSE) {
      best = { index: k, reductionSSE: reduction, beforeMean: mL, afterMean: mR }
    }
  }
  return best.reductionSSE > 0 ? best : null
}

/**
 * Kaplan–Meier 추정
 * @param times 일수 (양수)
 * @param eventOccurred true=해당 시점에 재방문(이벤트), false=꼬임(해당 시점까지 미이벤트)
 */
export function kaplanMeierEstimate(
  times: number[],
  eventOccurred: boolean[]
): { time: number; survival: number }[] {
  const data = times
    .map((t, i) => ({ t, ev: eventOccurred[i] }))
    .filter((x) => x.t > 0)
  if (data.length === 0) return []
  const uniq = [...new Set(data.map((d) => d.t))].sort((a, b) => a - b)
  let survival = 1
  const out: { time: number; survival: number }[] = []
  for (const t of uniq) {
    const atRisk = data.filter((d) => d.t >= t).length
    const failures = data.filter((d) => d.t === t && d.ev).length
    if (atRisk <= 0) break
    if (failures > 0) {
      survival *= (atRisk - failures) / atRisk
      out.push({ time: t, survival })
    }
  }
  return out
}

/** 환자별 첫 재방문 KM용 (2회 이상: 간격·이벤트, 1회: 꼬임 일수) */
export function buildFirstReturnKmSeries(
  gapsDays: (number | null)[],
  singleVisitCensorDays: (number | null)[]
): { times: number[]; eventOccurred: boolean[] } {
  const times: number[] = []
  const eventOccurred: boolean[] = []
  for (let i = 0; i < gapsDays.length; i++) {
    const g = gapsDays[i]
    const c = singleVisitCensorDays[i]
    if (g != null && g > 0) {
      times.push(g)
      eventOccurred.push(true)
    } else if (c != null && c > 0) {
      times.push(c)
      eventOccurred.push(false)
    }
  }
  return { times, eventOccurred }
}

/** PSI (Population Stability Index) */
export function populationStabilityIndex(expected: number[], actual: number[]): number {
  const sumE = expected.reduce((s, v) => s + v, 0)
  const sumA = actual.reduce((s, v) => s + v, 0)
  if (sumE <= 0 || sumA <= 0 || expected.length !== actual.length) return 0
  let psi = 0
  for (let i = 0; i < expected.length; i++) {
    const e = expected[i] / sumE
    const a = actual[i] / sumA
    if (e > 0 && a > 0) psi += (a - e) * Math.log(a / e)
  }
  return psi
}

/** 간단 k-means (2차원) */
export function kMeans2D(
  points: [number, number][],
  k: number,
  maxIter = 50
): { labels: number[]; centroids: [number, number][] } {
  const n = points.length
  if (n === 0 || k <= 0) return { labels: [], centroids: [] }
  const kk = Math.min(k, n)
  const centroids: [number, number][] = []
  for (let i = 0; i < kk; i++) {
    centroids.push([...points[Math.floor((i * n) / kk)]])
  }
  const labels = new Array(n).fill(0)
  for (let it = 0; it < maxIter; it++) {
    let changed = false
    for (let i = 0; i < n; i++) {
      let best = 0
      let bestD = Infinity
      for (let c = 0; c < kk; c++) {
        const dx = points[i][0] - centroids[c][0]
        const dy = points[i][1] - centroids[c][1]
        const d = dx * dx + dy * dy
        if (d < bestD) {
          bestD = d
          best = c
        }
      }
      if (labels[i] !== best) {
        labels[i] = best
        changed = true
      }
    }
    const sums: [number, number][] = Array.from({ length: kk }, () => [0, 0])
    const counts = new Array(kk).fill(0)
    for (let i = 0; i < n; i++) {
      sums[labels[i]][0] += points[i][0]
      sums[labels[i]][1] += points[i][1]
      counts[labels[i]]++
    }
    for (let c = 0; c < kk; c++) {
      if (counts[c] > 0) {
        centroids[c] = [sums[c][0] / counts[c], sums[c][1] / counts[c]]
      }
    }
    if (!changed) break
  }
  return { labels, centroids }
}

/** 질병 전이 빈도 (순서 있음) */
export function diseaseTransitionCounts(
  sequences: string[][]
): Map<string, number> {
  const map = new Map<string, number>()
  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 1; i++) {
      const a = seq[i]
      const b = seq[i + 1]
      if (!a || !b) continue
      const key = `${a} → ${b}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }
  }
  return map
}

/** 월 더미 고정효과 제거 후 잔차 (단변량 시계열) */
export function monthFixedEffectsResiduals(
  monthKeys: string[],
  counts: number[]
): { fitted: number[]; residual: number[]; monthEffects: Map<string, number> } {
  const n = counts.length
  if (n === 0) return { fitted: [], residual: [], monthEffects: new Map() }
  const overall = counts.reduce((s, v) => s + v, 0) / n
  const byMonth = new Map<string, number[]>()
  monthKeys.forEach((m, i) => {
    if (!byMonth.has(m)) byMonth.set(m, [])
    byMonth.get(m)!.push(counts[i])
  })
  const effect = new Map<string, number>()
  byMonth.forEach((arr, m) => {
    const mu = arr.reduce((s, v) => s + v, 0) / arr.length
    effect.set(m, mu - overall)
  })
  const fitted = monthKeys.map((m) => overall + (effect.get(m) ?? 0))
  const residual = counts.map((c, i) => c - fitted[i])
  return { fitted, residual, monthEffects: effect }
}

/** 계층 일관성 점검: 상위 질병 월평균 합 vs 전체 월합 (단순 비율) */
export function hierarchicalConsistencyRatio(
  diseaseMonthlyTotals: Map<string, number[]>,
  overallMonthly: number[],
  topN: number
): number | null {
  if (overallMonthly.length === 0) return null
  const totals = Array.from(diseaseMonthlyTotals.entries()).map(([d, arr]) => ({
    d,
    t: arr.reduce((s, v) => s + v, 0),
  }))
  totals.sort((a, b) => b.t - a.t)
  const top = totals.slice(0, topN)
  const sumTop = overallMonthly.map((_, i) =>
    top.reduce((s, row) => s + (diseaseMonthlyTotals.get(row.d)?.[i] ?? 0), 0)
  )
  const ratio =
    sumTop.reduce((s, v) => s + v, 0) /
    Math.max(1, overallMonthly.reduce((s, v) => s + v, 0))
  return ratio
}

/** 분석 설정 스냅샷 (재현용 JSON) */
export function buildAnalysisSettingsSnapshot(params: {
  wilsonConfidence: number
  fdrQ: number
  zAnomalyThreshold: number
  stlTrendWindow: number
  kmMaxDays: number
}): Record<string, unknown> {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    ...params,
  }
}
