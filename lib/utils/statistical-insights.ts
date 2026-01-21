/**
 * 통계 기반 인사이트 유틸리티
 * AI 없이 Z-Score, 표준편차, 이동평균, IQR 등 통계적 방법으로 이상치 및 패턴 탐지
 * 
 * @version 1.0.0
 * @since 2025-01-21
 */

// ============ 기본 통계 함수들 ============

/**
 * 평균 계산
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

/**
 * 표준편차 계산
 */
export function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = calculateMean(values)
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Z-Score 계산
 * 데이터 포인트가 평균에서 몇 표준편차 떨어져 있는지 측정
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0
  return (value - mean) / stdDev
}

/**
 * 중앙값 계산
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * 백분위수 계산
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

/**
 * IQR (사분위 범위) 계산
 */
export function calculateIQR(values: number[]): { q1: number; q3: number; iqr: number; lowerBound: number; upperBound: number } {
  const q1 = calculatePercentile(values, 25)
  const q3 = calculatePercentile(values, 75)
  const iqr = q3 - q1
  return {
    q1,
    q3,
    iqr,
    lowerBound: q1 - 1.5 * iqr,
    upperBound: q3 + 1.5 * iqr
  }
}

/**
 * 이동평균 계산
 */
export function calculateMovingAverage(values: number[], windowSize: number): number[] {
  if (values.length < windowSize) return values
  const result: number[] = []
  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1)
    result.push(calculateMean(window))
  }
  return result
}

// ============ 이상 탐지 함수들 ============

export type AnomalyLevel = 'critical' | 'warning' | 'normal' | 'excellent'

export interface AnomalyResult {
  value: number
  zScore: number
  level: AnomalyLevel
  isAnomaly: boolean
  percentile: number
  description: string
}

/**
 * Z-Score 기반 이상 탐지
 * |Z| > 3: critical (상위/하위 0.135%)
 * |Z| > 2: warning (상위/하위 2.275%)
 * |Z| > 1: normal but noteworthy
 */
export function detectAnomalyByZScore(
  value: number,
  historicalValues: number[],
  options: { criticalThreshold?: number; warningThreshold?: number } = {}
): AnomalyResult {
  const { criticalThreshold = 3, warningThreshold = 2 } = options
  
  const mean = calculateMean(historicalValues)
  const stdDev = calculateStdDev(historicalValues)
  const zScore = calculateZScore(value, mean, stdDev)
  const absZScore = Math.abs(zScore)
  
  // 백분위 계산 (정규분포 가정)
  const percentile = calculateValuePercentile(value, historicalValues)
  
  let level: AnomalyLevel = 'normal'
  let isAnomaly = false
  let description = ''
  
  if (absZScore >= criticalThreshold) {
    level = zScore < 0 ? 'critical' : 'excellent'
    isAnomaly = true
    description = zScore < 0 
      ? `심각한 하락: 평균 대비 ${absZScore.toFixed(1)}σ 이하 (하위 ${percentile.toFixed(1)}%)`
      : `탁월한 성과: 평균 대비 ${absZScore.toFixed(1)}σ 이상 (상위 ${(100 - percentile).toFixed(1)}%)`
  } else if (absZScore >= warningThreshold) {
    level = zScore < 0 ? 'warning' : 'normal'
    isAnomaly = zScore < 0
    description = zScore < 0
      ? `주의 필요: 평균 대비 ${absZScore.toFixed(1)}σ 이하 (하위 ${percentile.toFixed(1)}%)`
      : `양호: 평균 대비 ${absZScore.toFixed(1)}σ 이상`
  } else {
    description = `정상 범위: 평균 ±${absZScore.toFixed(1)}σ 이내`
  }
  
  return { value, zScore, level, isAnomaly, percentile, description }
}

/**
 * 값의 백분위 계산 (히스토리 데이터 기반)
 */
export function calculateValuePercentile(value: number, historicalValues: number[]): number {
  if (historicalValues.length === 0) return 50
  const sorted = [...historicalValues].sort((a, b) => a - b)
  const belowCount = sorted.filter(v => v < value).length
  return (belowCount / sorted.length) * 100
}

/**
 * IQR 기반 이상치 탐지
 */
export function detectOutliersByIQR(values: number[]): { outliers: number[]; normal: number[]; bounds: ReturnType<typeof calculateIQR> } {
  const bounds = calculateIQR(values)
  const outliers = values.filter(v => v < bounds.lowerBound || v > bounds.upperBound)
  const normal = values.filter(v => v >= bounds.lowerBound && v <= bounds.upperBound)
  return { outliers, normal, bounds }
}

// ============ 트렌드 분석 함수들 ============

export interface TrendResult {
  direction: 'increasing' | 'decreasing' | 'stable'
  changeRate: number
  strength: 'strong' | 'moderate' | 'weak'
  description: string
}

/**
 * 선형 회귀를 통한 트렌드 분석
 */
export function analyzeTrend(values: number[]): TrendResult {
  if (values.length < 2) {
    return { direction: 'stable', changeRate: 0, strength: 'weak', description: '데이터 부족' }
  }
  
  // 간단한 선형 회귀 (최소제곱법)
  const n = values.length
  const x = values.map((_, i) => i)
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const mean = sumY / n
  const changeRate = mean !== 0 ? (slope / mean) * 100 : 0
  
  let direction: TrendResult['direction'] = 'stable'
  let strength: TrendResult['strength'] = 'weak'
  
  const absChangeRate = Math.abs(changeRate)
  
  if (absChangeRate > 5) {
    direction = slope > 0 ? 'increasing' : 'decreasing'
    strength = absChangeRate > 15 ? 'strong' : absChangeRate > 10 ? 'moderate' : 'weak'
  }
  
  let description = ''
  if (direction === 'increasing') {
    description = `상승 추세 (${strength === 'strong' ? '강한' : strength === 'moderate' ? '중간' : '약한'}): +${changeRate.toFixed(1)}%/기간`
  } else if (direction === 'decreasing') {
    description = `하락 추세 (${strength === 'strong' ? '강한' : strength === 'moderate' ? '중간' : '약한'}): ${changeRate.toFixed(1)}%/기간`
  } else {
    description = '안정적 추세 유지'
  }
  
  return { direction, changeRate, strength, description }
}

// ============ 동적 임계값 계산 ============

export interface DynamicThreshold {
  mean: number
  stdDev: number
  lowerWarning: number  // mean - 1.5σ
  lowerCritical: number // mean - 2σ
  upperWarning: number  // mean + 1.5σ
  upperCritical: number // mean + 2σ
}

/**
 * 과거 데이터 기반 동적 임계값 계산
 */
export function calculateDynamicThresholds(historicalValues: number[]): DynamicThreshold {
  const mean = calculateMean(historicalValues)
  const stdDev = calculateStdDev(historicalValues)
  
  return {
    mean,
    stdDev,
    lowerWarning: mean - 1.5 * stdDev,
    lowerCritical: mean - 2 * stdDev,
    upperWarning: mean + 1.5 * stdDev,
    upperCritical: mean + 2 * stdDev
  }
}

// ============ 복합 인사이트 생성 ============

export interface StatisticalInsight {
  id: string
  category: 'critical' | 'warning' | 'info' | 'success'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  statisticalBasis: string
  confidence: number // 0-100
  recommendations: string[]
  metrics: {
    currentValue: number
    mean: number
    stdDev: number
    zScore: number
    percentile: number
    trend?: TrendResult
  }
}

/**
 * 통계적 근거를 포함한 인사이트 생성
 */
export function generateStatisticalInsight(
  metricName: string,
  currentValue: number,
  historicalValues: number[],
  options: {
    higherIsBetter?: boolean
    unit?: string
    customThresholds?: { warning: number; critical: number }
  } = {}
): StatisticalInsight | null {
  const { higherIsBetter = true, unit = '', customThresholds } = options
  
  if (historicalValues.length < 3) return null
  
  const mean = calculateMean(historicalValues)
  const stdDev = calculateStdDev(historicalValues)
  const zScore = calculateZScore(currentValue, mean, stdDev)
  const percentile = calculateValuePercentile(currentValue, historicalValues)
  const trend = analyzeTrend([...historicalValues, currentValue])
  
  const absZScore = Math.abs(zScore)
  const isPositive = higherIsBetter ? zScore > 0 : zScore < 0
  
  // 카테고리 및 우선순위 결정
  let category: StatisticalInsight['category'] = 'info'
  let priority: StatisticalInsight['priority'] = 'low'
  let title = ''
  let description = ''
  let statisticalBasis = ''
  const recommendations: string[] = []
  
  // 신뢰도 계산 (데이터 포인트 수 및 표준편차 기반)
  const confidence = Math.min(95, 50 + historicalValues.length * 2 + (stdDev > 0 ? 20 : 0))
  
  const warningThreshold = customThresholds?.warning ?? 2
  const criticalThreshold = customThresholds?.critical ?? 3
  
  if (absZScore >= criticalThreshold) {
    if (isPositive) {
      category = 'success'
      priority = 'medium'
      title = `${metricName} 탁월한 성과`
      description = `현재 ${currentValue.toFixed(1)}${unit}로 역대 상위 ${(100 - percentile).toFixed(1)}%에 해당합니다.`
      statisticalBasis = `Z-Score: +${zScore.toFixed(2)} (평균 ${mean.toFixed(1)}${unit}, 표준편차 ${stdDev.toFixed(1)}${unit} 대비 ${absZScore.toFixed(1)}σ 상회)`
      recommendations.push('현재 성과 요인 분석 및 문서화', '모범 사례로 확산 검토')
    } else {
      category = 'critical'
      priority = 'high'
      title = `${metricName} 심각한 ${higherIsBetter ? '하락' : '상승'}`
      description = `현재 ${currentValue.toFixed(1)}${unit}로 역대 하위 ${percentile.toFixed(1)}%에 해당합니다. 즉각적인 조치가 필요합니다.`
      statisticalBasis = `Z-Score: ${zScore.toFixed(2)} (평균 ${mean.toFixed(1)}${unit}, 표준편차 ${stdDev.toFixed(1)}${unit} 대비 ${absZScore.toFixed(1)}σ 하회)`
      recommendations.push('원인 분석 즉시 시행', '긴급 대응 계획 수립', '이해관계자 알림')
    }
  } else if (absZScore >= warningThreshold) {
    if (isPositive) {
      category = 'success'
      priority = 'low'
      title = `${metricName} 양호`
      description = `현재 ${currentValue.toFixed(1)}${unit}로 평균 이상의 성과를 보이고 있습니다.`
      statisticalBasis = `Z-Score: +${zScore.toFixed(2)} (상위 ${(100 - percentile).toFixed(1)}% 수준)`
      recommendations.push('현재 수준 유지', '추가 개선 기회 탐색')
    } else {
      category = 'warning'
      priority = 'medium'
      title = `${metricName} 주의 필요`
      description = `현재 ${currentValue.toFixed(1)}${unit}로 평균 대비 하락세입니다. 모니터링 강화가 필요합니다.`
      statisticalBasis = `Z-Score: ${zScore.toFixed(2)} (하위 ${percentile.toFixed(1)}% 수준)`
      recommendations.push('원인 분석 및 모니터링 강화', '개선 계획 수립 검토')
    }
  } else {
    // 정상 범위 - 트렌드 기반 인사이트
    if (trend.direction !== 'stable' && trend.strength !== 'weak') {
      category = trend.direction === 'increasing' && higherIsBetter ? 'info' : 'warning'
      priority = trend.strength === 'strong' ? 'medium' : 'low'
      title = `${metricName} ${trend.direction === 'increasing' ? '상승' : '하락'} 추세`
      description = `정상 범위 내이지만 ${trend.strength === 'strong' ? '강한' : '중간'} ${trend.direction === 'increasing' ? '상승' : '하락'} 추세가 감지되었습니다.`
      statisticalBasis = `트렌드 분석: ${trend.changeRate > 0 ? '+' : ''}${trend.changeRate.toFixed(1)}%/기간, Z-Score: ${zScore.toFixed(2)}`
      recommendations.push(
        trend.direction === 'increasing' && higherIsBetter 
          ? '긍정적 추세 유지 전략 수립' 
          : '추세 전환을 위한 조치 검토'
      )
    } else {
      return null // 정상 범위 & 안정적 추세면 인사이트 생성 안함
    }
  }
  
  return {
    id: `stat-${metricName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    category,
    priority,
    title,
    description,
    statisticalBasis,
    confidence,
    recommendations,
    metrics: {
      currentValue,
      mean,
      stdDev,
      zScore,
      percentile,
      trend
    }
  }
}

// ============ 비교 분석 ============

export interface ComparisonResult {
  current: number
  baseline: number
  difference: number
  percentChange: number
  significance: 'significant' | 'moderate' | 'insignificant'
  direction: 'up' | 'down' | 'same'
}

/**
 * 기간 대비 비교 분석
 */
export function compareWithBaseline(
  currentValue: number,
  baselineValue: number,
  baselineStdDev?: number
): ComparisonResult {
  const difference = currentValue - baselineValue
  const percentChange = baselineValue !== 0 ? (difference / baselineValue) * 100 : 0
  
  let significance: ComparisonResult['significance'] = 'insignificant'
  
  if (baselineStdDev && baselineStdDev > 0) {
    const zDiff = Math.abs(difference) / baselineStdDev
    significance = zDiff > 2 ? 'significant' : zDiff > 1 ? 'moderate' : 'insignificant'
  } else {
    const absChange = Math.abs(percentChange)
    significance = absChange > 20 ? 'significant' : absChange > 10 ? 'moderate' : 'insignificant'
  }
  
  return {
    current: currentValue,
    baseline: baselineValue,
    difference,
    percentChange,
    significance,
    direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'same'
  }
}
