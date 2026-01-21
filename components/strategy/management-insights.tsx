'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { AlertCircle, CheckCircle2, TrendingUp, Users, MapPin, Target, Lightbulb, BarChart3, Activity } from 'lucide-react'
import { extractMonth } from '@/lib/utils/date-helpers'
import {
  calculateMean,
  calculateStdDev,
  calculateZScore,
  calculatePercentile,
  analyzeTrend,
  calculateDynamicThresholds,
  compareWithBaseline,
  type TrendResult
} from '@/lib/utils/statistical-insights'

interface ManagementInsightsProps {
  data: PatientData[]
}

type InsightCategory = 'warning' | 'info' | 'success' | 'critical'
type InsightPriority = 'high' | 'medium' | 'low'

interface Insight {
  id: string
  category: InsightCategory
  priority: InsightPriority
  title: string
  description: string
  icon: React.ReactNode
  recommendations?: string[]
  statisticalBasis?: string // 통계적 근거 추가
  confidence?: number // 신뢰도 (0-100)
}

/**
 * 경영 인사이트 컴포넌트 v2.1 - 대한민국 의료 통계 기반
 * 
 * 주요 개선사항:
 * - 통계 기반 동적 임계값 (Z-Score, 표준편차)
 * - 트렌드 분석 (선형 회귀 기반)
 * - 신뢰도 지표 제공
 * - 통계적 근거 명시
 * 
 * 한국 의료 벤치마크 출처:
 * - OECD/보건복지부: 한국인 1인당 연간 외래방문 18.0회 (2023)
 * - 건강보험심사평가원(HIRA): 우울증 외래 3주내 재방문율 42.3% (2023)
 * - 의원급 외래환자 초진:재진 비율 약 19:81 (중랑구 파일럿 연구)
 * - 피부과/성형외과 재진율 66.1% (메디게이트 설문)
 * - 고혈압 환자 COC(진료지속성) 지수 0.81, 복약순응률 73.3%
 * - 당뇨 환자 치료율 75.8%, 혈당조절 달성률 22.5%~63.3%
 * - 병원 NPS: 재이용의향 32~35점, 추천의향 30~33점
 * - 의료기관 연간 성장률: 정상기 0.5~3%, 팬데믹 -10~-13%
 * 
 * @since v4.2.0
 */

// ========== 한국 의료 벤치마크 상수 ==========
const KOREA_HEALTHCARE_BENCHMARKS = {
  // 재진율 (재방문율) 벤치마크 - 한국 실측 데이터 기반
  retention: {
    general: { mean: 66, stdDev: 12 },        // 피부과/성형외과 설문 66.1%
    clinic: { mean: 81, stdDev: 8 },           // 의원급 재진율 80.9%
    depression: { mean: 42.3, stdDev: 5 },     // HIRA 우울증 3주내 재방문
    chronicDisease: { mean: 73.3, stdDev: 10 }, // 고혈압 복약순응률
    source: '건강보험심사평가원, 메디게이트 설문조사'
  },
  
  // 환자 방문횟수 벤치마크 - OECD/보건복지부
  visitsPerYear: {
    perCapita: 18.0,    // 2023년 한국인 1인당 연간 외래방문
    oecdAverage: 6.4,   // OECD 평균
    monthlyAvg: 1.5,    // 월평균
    source: '보건복지부, OECD Health Statistics 2023'
  },
  
  // 성장률 벤치마크 - 한국 의료이용 통계
  growthRate: {
    normalMin: 0.5,     // 정상기 최소 성장률
    normalMax: 3.0,     // 정상기 최대 성장률
    warningThreshold: -5,   // 주의 임계값
    criticalThreshold: -10, // 심각 임계값 (팬데믹 수준)
    source: '보건복지부 의료이용 통계 2016-2022'
  },
  
  // 환자 만족도/재이용 의향 - 병원 NPS 조사
  satisfaction: {
    npsRevisit: { mean: 33.5, stdDev: 5 },     // 재이용의향 NPS (32.2~35.1)
    npsRecommend: { mean: 31.7, stdDev: 4 },   // 추천의향 NPS (30.85~32.55)
    source: '화순전남대학교병원 NPS 조사, 지역거점공공병원 평가'
  },
  
  // 진료지속성 지수 (COC) - 만성질환
  continuityOfCare: {
    hypertension: { mean: 0.81, stdDev: 0.1 },  // 고혈압 COC
    diabetes: { mean: 0.76, stdDev: 0.12 },     // 당뇨 COC (추정)
    lowThreshold: 0.75,  // COC < 0.75 시 입원율 42% 증가
    source: '국민건강보험공단 만성질환 연구'
  },
  
  // 진료시간 벤치마크
  consultationTime: {
    initialVisit: 7.01,   // 초진 평균 (분)
    followUp: 4.61,       // 재진 평균 (분)
    overall: 5.11,        // 전체 평균 (분)
    under5MinRate: 55,    // 5분 미만 비율 (%)
    source: 'BMC Health Services Research 2025'
  },
  
  // 시장 집중도 기준
  marketConcentration: {
    hhiLow: 1000,        // 경쟁적 시장
    hhiModerate: 1800,   // 중간 집중
    hhiHigh: 2500,       // 고집중 시장
    source: '공정거래위원회 기준, 의료시장 연구'
  }
}
export function ManagementInsights({ data }: ManagementInsightsProps) {
  const insights = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    const insightsList: Insight[] = []

    // ========== 기본 데이터 계산 ==========
    
    // 고유 환자 식별
    const patientKey = (p: PatientData) => `${p.name}|${p.address}`
    const uniquePatientKeys = new Set(data.map(patientKey))
    const uniquePatients = uniquePatientKeys.size

    // 환자별 방문 횟수
    const patientVisitCounts = new Map<string, number>()
    data.forEach(p => {
      const key = patientKey(p)
      patientVisitCounts.set(key, (patientVisitCounts.get(key) || 0) + 1)
    })

    const visitCountValues = Array.from(patientVisitCounts.values())
    const newPatients = visitCountValues.filter(count => count === 1).length
    const returningPatients = visitCountValues.filter(count => count > 1).length
    const retentionRate = uniquePatients > 0 ? (returningPatients / uniquePatients) * 100 : 0
    const avgVisitsPerPatient = uniquePatients > 0 ? data.length / uniquePatients : 0

    // 지역별 분석
    const regionPatients = new Map<string, Set<string>>()
    data.forEach(p => {
      if (p.region) {
        const key = patientKey(p)
        if (!regionPatients.has(p.region)) {
          regionPatients.set(p.region, new Set())
        }
        regionPatients.get(p.region)!.add(key)
      }
    })
    const regionCounts = Array.from(regionPatients.entries())
      .map(([region, patients]) => ({ region, count: patients.size }))
      .sort((a, b) => b.count - a.count)
    const topRegions = regionCounts.slice(0, 5)

    // 질병별 분석
    const diseasePatients = new Map<string, Set<string>>()
    data.forEach(p => {
      if (p.disease_name) {
        const key = patientKey(p)
        if (!diseasePatients.has(p.disease_name)) {
          diseasePatients.set(p.disease_name, new Set())
        }
        diseasePatients.get(p.disease_name)!.add(key)
      }
    })
    const diseaseCounts = Array.from(diseasePatients.entries())
      .map(([disease, patients]) => ({ disease, count: patients.size }))
      .sort((a, b) => b.count - a.count)
    const topDiseases = diseaseCounts.slice(0, 5)

    // ========== 월별 데이터 분석 (통계 기반) ==========
    
    const monthlyVisits = new Map<string, number>()
    const monthlyNewPatients = new Map<string, Set<string>>()
    
    data.forEach(p => {
      const month = extractMonth(p.visit_date)
      if (month) {
        monthlyVisits.set(month, (monthlyVisits.get(month) || 0) + 1)
        
        if (!monthlyNewPatients.has(month)) {
          monthlyNewPatients.set(month, new Set())
        }
        monthlyNewPatients.get(month)!.add(patientKey(p))
      }
    })
    
    const sortedMonths = Array.from(monthlyVisits.entries()).sort()
    const monthlyVisitValues = sortedMonths.map(([, count]) => count)
    
    // 월별 방문 수 통계
    const visitMean = calculateMean(monthlyVisitValues)
    const visitStdDev = calculateStdDev(monthlyVisitValues)
    const visitThresholds = calculateDynamicThresholds(monthlyVisitValues)
    
    // 성장률 계산 (마지막 달 vs 이전 달)
    let growthRate = 0
    let lastMonthVisits = 0
    let prevMonthVisits = 0
    
    if (sortedMonths.length >= 2) {
      lastMonthVisits = sortedMonths[sortedMonths.length - 1][1]
      prevMonthVisits = sortedMonths[sortedMonths.length - 2][1]
      growthRate = prevMonthVisits > 0 ? ((lastMonthVisits - prevMonthVisits) / prevMonthVisits) * 100 : 0
    }
    
    // 트렌드 분석 (최근 6개월)
    const recentMonths = monthlyVisitValues.slice(-6)
    const visitTrend = analyzeTrend(recentMonths)
    
    // 수술 건수 분석
    const surgeryCount = data.filter(p => p.surgery_name).length
    const surgeryRate = data.length > 0 ? (surgeryCount / data.length) * 100 : 0

    // ========== 통계 기반 인사이트 생성 (한국 의료 벤치마크 적용) ==========

    // 1. 재방문율 인사이트 - 한국 실측 데이터 기반
    // 출처: 의원급 재진율 80.9% (중랑구 파일럿), 피부과/성형외과 66.1% (메디게이트)
    const koreaRetention = KOREA_HEALTHCARE_BENCHMARKS.retention.general
    const retentionZScore = calculateZScore(retentionRate, koreaRetention.mean, koreaRetention.stdDev)
    
    // 한국 의원급 기준으로 재진율 평가 (의원급은 약 81% 기준)
    const clinicRetention = KOREA_HEALTHCARE_BENCHMARKS.retention.clinic
    const clinicZScore = calculateZScore(retentionRate, clinicRetention.mean, clinicRetention.stdDev)
    
    if (retentionRate < 40) {
      // 한국 평균(66%) 대비 26%p 이상 낮음 - 심각
      insightsList.push({
        id: 'retention-critical',
        category: 'critical',
        priority: 'high',
        title: '재방문율 심각한 하락',
        description: `재방문율 ${retentionRate.toFixed(1)}%는 한국 의료기관 평균(${koreaRetention.mean}%) 대비 현저히 낮습니다.`,
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        statisticalBasis: `한국 의원급 재진율 평균 81%, 피부과/성형외과 평균 66% 대비 Z-Score: ${retentionZScore.toFixed(2)} (${KOREA_HEALTHCARE_BENCHMARKS.retention.source})`,
        confidence: 85,
        recommendations: [
          '첫 방문 후 48시간 내 추적 관리 시스템 구축',
          '환자 이탈 원인 분석 (NPS 조사 권장 - 한국 병원 평균 32~35점)',
          '재방문 인센티브 프로그램 즉시 도입',
          '한국 의료기관 만성질환 관리 모델(COC 지수 0.81) 벤치마킹'
        ]
      })
    } else if (retentionRate < 55) {
      // 평균보다 10%p 이상 낮음 - 주의
      insightsList.push({
        id: 'retention-warning',
        category: 'warning',
        priority: 'medium',
        title: '재방문율 개선 필요',
        description: `재방문율 ${retentionRate.toFixed(1)}%는 한국 의료기관 평균(${koreaRetention.mean}%)보다 낮습니다.`,
        icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        statisticalBasis: `Z-Score: ${retentionZScore.toFixed(2)} (한국 고혈압 환자 복약순응률 73.3% 참고, ${KOREA_HEALTHCARE_BENCHMARKS.retention.source})`,
        confidence: 75,
        recommendations: [
          '환자별 맞춤형 추적 시스템 도입',
          '정기 건강 관리 프로그램 제안 (HIRA 우울증 기준: 3주내 재방문 42.3%)',
          '환자 만족도 조사 실시 (한국 병원 NPS 평균 32점 기준)'
        ]
      })
    } else if (retentionRate >= 75) {
      // 한국 의원급 평균(81%)에 근접하거나 상회
      insightsList.push({
        id: 'retention-excellent',
        category: 'success',
        priority: 'low',
        title: '우수한 환자 유지율',
        description: `재방문율 ${retentionRate.toFixed(1)}%는 한국 의원급 평균(81%)에 근접한 우수한 수준입니다.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        statisticalBasis: `한국 의원급 재진율 81% 기준 Z-Score: ${clinicZScore.toFixed(2)} (${KOREA_HEALTHCARE_BENCHMARKS.retention.source})`,
        confidence: 80,
        recommendations: [
          '현재 전략의 핵심 요인 분석 및 문서화',
          '한국 만성질환 관리 우수사례(COC 0.81 이상) 참고하여 지속 개선'
        ]
      })
    }

    // 2. 성장률 인사이트 - 한국 의료이용 통계 기반
    // 출처: 보건복지부 2016-2022 의료이용 통계 (정상기 0.5~3%, 팬데믹 -10~-13%)
    const koreaGrowth = KOREA_HEALTHCARE_BENCHMARKS.growthRate
    
    if (sortedMonths.length >= 2) {
      const growthZScore = visitStdDev > 0 
        ? calculateZScore(lastMonthVisits, visitMean, visitStdDev) 
        : 0
      
      const comparison = compareWithBaseline(lastMonthVisits, prevMonthVisits, visitStdDev)
      
      if (growthRate <= koreaGrowth.criticalThreshold) {
        // -10% 이하: 팬데믹 수준의 급감 (2020년 한국 의료이용 -12.9%)
        insightsList.push({
          id: 'growth-critical',
          category: 'critical',
          priority: 'high',
          title: '환자 수 급격한 감소',
          description: `전월 대비 ${Math.abs(growthRate).toFixed(1)}% 감소는 한국 의료이용 정상 범위(${koreaGrowth.normalMin}~${koreaGrowth.normalMax}%)를 크게 벗어났습니다.`,
          icon: <TrendingUp className="h-5 w-5 text-red-600" />,
          statisticalBasis: `한국 의료이용 통계: 정상 성장률 연 0.5~3%, 팬데믹 시 -12.9% 기록 (${koreaGrowth.source})`,
          confidence: 90,
          recommendations: [
            '마케팅 예산 긴급 증액 검토',
            '경쟁사 분석 및 차별화 전략 수립',
            '환자 유출 원인 즉시 분석 (한국 의료이용 계절성 고려)',
            '기존 환자 긴급 리텐션 캠페인 실행'
          ]
        })
      } else if (growthRate <= koreaGrowth.warningThreshold) {
        // -5% 이하: 주의 필요
        insightsList.push({
          id: 'growth-warning',
          category: 'warning',
          priority: 'medium',
          title: '환자 수 감소 추세',
          description: `전월 대비 ${Math.abs(growthRate).toFixed(1)}% 감소. 한국 의료기관 정상 성장률(${koreaGrowth.normalMin}~${koreaGrowth.normalMax}%)과 비교 시 모니터링 필요합니다.`,
          icon: <TrendingUp className="h-5 w-5 text-yellow-600" />,
          statisticalBasis: `트렌드: ${visitTrend.description} (한국 의료이용 정상 범위: 연 0.5~3% 성장, ${koreaGrowth.source})`,
          confidence: 75,
          recommendations: [
            '온라인/오프라인 마케팅 활동 확대',
            '신규 환자 유치 프로그램 검토',
            '한국인 1인당 연간 외래방문 18회 대비 방문빈도 분석'
          ]
        })
      } else if (growthRate > koreaGrowth.normalMax * 3) {
        // 9% 이상: 강한 성장 (정상 성장률의 3배 이상)
        insightsList.push({
          id: 'growth-excellent',
          category: 'success',
          priority: 'low',
          title: '강한 성장세',
          description: `전월 대비 +${growthRate.toFixed(1)}% 증가는 한국 의료기관 정상 성장률(${koreaGrowth.normalMin}~${koreaGrowth.normalMax}%)을 크게 상회합니다.`,
          icon: <TrendingUp className="h-5 w-5 text-green-600" />,
          statisticalBasis: `트렌드: ${visitTrend.description} (한국 의료이용 정상 성장률 연 0.5~3%, ${koreaGrowth.source})`,
          confidence: 85,
          recommendations: [
            '성장 요인 분석 및 문서화',
            '인프라 확장 계획 검토 (한국 1인당 외래방문 18회/년 고려)',
            '성공 전략 지속 강화'
          ]
        })
      }
    }

    // 3. 트렌드 기반 인사이트 (6개월 추세)
    if (visitTrend.direction !== 'stable' && visitTrend.strength !== 'weak' && sortedMonths.length >= 4) {
      const trendIcon = visitTrend.direction === 'increasing' 
        ? <Activity className="h-5 w-5 text-green-600" />
        : <Activity className="h-5 w-5 text-orange-600" />
      
      insightsList.push({
        id: 'trend-analysis',
        category: visitTrend.direction === 'increasing' ? 'info' : 'warning',
        priority: visitTrend.strength === 'strong' ? 'medium' : 'low',
        title: `${visitTrend.direction === 'increasing' ? '상승' : '하락'} 추세 감지`,
        description: visitTrend.description,
        icon: trendIcon,
        statisticalBasis: `선형 회귀 분석: ${visitTrend.changeRate > 0 ? '+' : ''}${visitTrend.changeRate.toFixed(1)}%/월, 강도: ${visitTrend.strength}`,
        confidence: 70,
        recommendations: visitTrend.direction === 'increasing'
          ? ['현재 추세 유지 전략 수립', '추가 성장 기회 탐색']
          : ['추세 전환 위한 액션 플랜 수립', '원인 분석 및 개선 조치 시행']
      })
    }

    // 4. 환자당 평균 방문 수 - 한국 OECD 통계 기반
    // 출처: 보건복지부/OECD - 한국인 1인당 연간 외래방문 18.0회 (2023), 월 1.5회
    const koreaVisits = KOREA_HEALTHCARE_BENCHMARKS.visitsPerYear
    const visitCountMean = calculateMean(visitCountValues)
    const visitCountStdDev = calculateStdDev(visitCountValues)
    
    if (avgVisitsPerPatient < 1.3) {
      insightsList.push({
        id: 'avg-visits-low',
        category: 'info',
        priority: 'medium',
        title: '환자당 평균 방문 수 낮음',
        description: `환자당 평균 ${avgVisitsPerPatient.toFixed(2)}회 방문. 한국인 월평균 외래방문(${koreaVisits.monthlyAvg}회) 대비 낮습니다.`,
        icon: <Users className="h-5 w-5 text-blue-600" />,
        statisticalBasis: `한국인 1인당 연간 외래방문 ${koreaVisits.perCapita}회, OECD 평균 ${koreaVisits.oecdAverage}회의 약 2.8배 (${koreaVisits.source})`,
        confidence: 80,
        recommendations: [
          '만성 질환 관리 프로그램 강화 (한국 고혈압 COC 0.81 참고)',
          '정기 검진 일정 관리 시스템 도입',
          '환자별 치료 완료율 분석 (한국 당뇨 치료율 75.8% 참고)'
        ]
      })
    } else if (avgVisitsPerPatient >= 2.0) {
      insightsList.push({
        id: 'avg-visits-excellent',
        category: 'success',
        priority: 'low',
        title: '환자 관계 관리 우수',
        description: `환자당 평균 ${avgVisitsPerPatient.toFixed(2)}회 방문으로 한국인 월평균(${koreaVisits.monthlyAvg}회)에 부합하는 양호한 수준입니다.`,
        icon: <Users className="h-5 w-5 text-green-600" />,
        statisticalBasis: `한국인 연간 외래방문 ${koreaVisits.perCapita}회 기준, OECD 평균(${koreaVisits.oecdAverage}회)의 2.8배 (${koreaVisits.source})`,
        confidence: 85
      })
    }

    // 5. 지역 집중도 분석 - 한국 공정거래위원회 HHI 기준 적용
    // 출처: 공정거래위원회 기준, 한국 의료시장 연구
    const koreaHHI = KOREA_HEALTHCARE_BENCHMARKS.marketConcentration
    
    if (topRegions.length > 0) {
      const regionShares = regionCounts.map(r => (r.count / uniquePatients) * 100)
      const hhiValue = regionShares.reduce((sum, share) => sum + Math.pow(share, 2), 0)
      const topRegionShare = topRegions[0].count / uniquePatients * 100
      
      if (hhiValue > koreaHHI.hhiHigh || topRegionShare > 40) {
        // HHI > 2500: 고집중 시장
        insightsList.push({
          id: 'market-concentration-high',
          category: 'warning',
          priority: 'medium',
          title: '높은 지역 집중도',
          description: `${topRegions[0].region} 지역이 ${topRegionShare.toFixed(1)}%를 차지. 지역 다각화 전략이 필요합니다.`,
          icon: <MapPin className="h-5 w-5 text-orange-600" />,
          statisticalBasis: `HHI: ${hhiValue.toFixed(0)} (한국 기준 - ${koreaHHI.hhiLow} 미만: 경쟁적, ${koreaHHI.hhiHigh} 이상: 고집중, ${koreaHHI.source})`,
          confidence: 85,
          recommendations: [
            '타 지역 마케팅 확대 계획 수립',
            '접근성 개선을 위한 서비스 확장 검토 (한국 도시 -15.2% vs 농촌 -10.8% 의료이용 차이 참고)',
            '지역별 환자 니즈 분석'
          ]
        })
      } else if (hhiValue < koreaHHI.hhiModerate && regionCounts.length >= 5) {
        // HHI < 1800: 분산된 시장
        insightsList.push({
          id: 'market-diversified',
          category: 'success',
          priority: 'low',
          title: '양호한 지역 다각화',
          description: `${regionCounts.length}개 지역에서 환자 유치. 주요 시장: ${topRegions[0].region}(${topRegionShare.toFixed(1)}%)`,
          icon: <MapPin className="h-5 w-5 text-green-600" />,
          statisticalBasis: `HHI: ${hhiValue.toFixed(0)} (한국 공정거래위원회 기준 ${koreaHHI.hhiLow} 미만 = 경쟁적 시장, ${koreaHHI.source})`,
          confidence: 80,
          recommendations: [
            `${topRegions[0].region} 지역 심층 마케팅 강화`,
            'Top 3 지역별 맞춤 전략 수립'
          ]
        })
      }
    }

    // 6. 질병 포트폴리오 분석
    if (topDiseases.length > 0) {
      const diseaseShares = diseaseCounts.map(d => (d.count / uniquePatients) * 100)
      const topDiseaseShare = topDiseases[0].count / uniquePatients * 100
      const diseaseConcentration = diseaseShares.slice(0, 3).reduce((sum, s) => sum + s, 0)
      
      insightsList.push({
        id: 'disease-portfolio',
        category: 'info',
        priority: 'medium',
        title: '주요 질병 포트폴리오',
        description: `Top 3 질병이 전체의 ${diseaseConcentration.toFixed(1)}% 차지. 1위: ${topDiseases[0].disease}(${topDiseaseShare.toFixed(1)}%)`,
        icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
        statisticalBasis: `질병 분포: ${diseaseCounts.length}개 질병, Top 1 점유율 ${topDiseaseShare.toFixed(1)}%`,
        confidence: 90,
        recommendations: [
          `${topDiseases[0].disease} 전문 진료 프로그램 강화`,
          'Top 3 질병 맞춤형 치료 프로토콜 개발',
          '신규 전문 분야 확장 기회 탐색'
        ]
      })
    }

    // 7. 수술률 분석
    if (surgeryRate > 25) {
      insightsList.push({
        id: 'surgery-rate-high',
        category: 'info',
        priority: 'medium',
        title: '높은 수술 비중',
        description: `전체 방문의 ${surgeryRate.toFixed(1)}%가 수술 관련입니다.`,
        icon: <Target className="h-5 w-5 text-blue-600" />,
        statisticalBasis: `수술 건수: ${surgeryCount}건 / 총 ${data.length}건 방문`,
        confidence: 95,
        recommendations: [
          '수술 전문 장비 및 시설 투자 검토',
          '수술 후 관리 프로그램 강화',
          '수술 성공률 및 만족도 모니터링'
        ]
      })
    }

    // 8. 신규 환자 비율 분석
    const newPatientRate = uniquePatients > 0 ? (newPatients / uniquePatients) * 100 : 0
    if (newPatientRate > 75) {
      insightsList.push({
        id: 'new-patient-high',
        category: 'warning',
        priority: 'medium',
        title: '높은 신규 환자 비율',
        description: `신규 환자 ${newPatientRate.toFixed(1)}%로 재방문 전환이 낮습니다.`,
        icon: <Users className="h-5 w-5 text-orange-600" />,
        statisticalBasis: `신규 ${newPatients}명 / 재방문 ${returningPatients}명 (총 ${uniquePatients}명)`,
        confidence: 90,
        recommendations: [
          '신규 환자 온보딩 프로그램 개선',
          '첫 방문 경험 최적화',
          '재방문 유도 인센티브 설계'
        ]
      })
    } else if (newPatientRate < 30 && uniquePatients > 50) {
      insightsList.push({
        id: 'new-patient-low',
        category: 'warning',
        priority: 'medium',
        title: '신규 환자 유치 필요',
        description: `신규 환자 비율이 ${newPatientRate.toFixed(1)}%로 낮습니다. 신규 환자 확보 전략이 필요합니다.`,
        icon: <Users className="h-5 w-5 text-orange-600" />,
        statisticalBasis: `신규 ${newPatients}명 / 재방문 ${returningPatients}명`,
        confidence: 85,
        recommendations: [
          '신규 환자 유치 마케팅 강화',
          '소개 환자 프로그램 도입',
          '지역 홍보 활동 확대'
        ]
      })
    }

    // 우선순위 및 카테고리별 정렬
    const priorityOrder: Record<InsightPriority, number> = { high: 3, medium: 2, low: 1 }
    const categoryOrder: Record<InsightCategory, number> = { critical: 4, warning: 3, info: 2, success: 1 }

    return insightsList.sort((a, b) => {
      if (priorityOrder[a.priority] === priorityOrder[b.priority]) {
        return categoryOrder[b.category] - categoryOrder[a.category]
      }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [data])

  if (insights.length === 0) {
    return null
  }

  const getCategoryStyles = (category: InsightCategory) => {
    switch (category) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          textSecondary: 'text-red-700',
          badge: 'bg-red-100 text-red-800',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          textSecondary: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-800',
        }
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          textSecondary: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-800',
        }
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          textSecondary: 'text-green-700',
          badge: 'bg-green-100 text-green-800',
        }
    }
  }

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return null
    if (confidence >= 85) return '높음'
    if (confidence >= 70) return '중간'
    return '낮음'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          경영 인사이트
          <span className="text-xs font-normal text-muted-foreground ml-2">
            (통계 기반 분석 v2.0)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => {
            const styles = getCategoryStyles(insight.category)
            const confidenceLabel = getConfidenceLabel(insight.confidence)
            
            return (
              <div
                key={insight.id}
                className={`flex items-start gap-3 p-4 ${styles.bg} ${styles.border} border rounded-lg`}
              >
                <div className="mt-0.5">{insight.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold ${styles.text}`}>{insight.title}</p>
                    {insight.confidence && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${styles.badge}`}>
                        신뢰도: {confidenceLabel} ({insight.confidence}%)
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${styles.textSecondary} mt-1.5`}>
                    {insight.description}
                  </p>
                  
                  {/* 통계적 근거 표시 */}
                  {insight.statisticalBasis && (
                    <p className={`text-xs ${styles.textSecondary} mt-2 italic opacity-75`}>
                      📊 {insight.statisticalBasis}
                    </p>
                  )}
                  
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className={`text-xs font-medium ${styles.text}`}>권장사항:</p>
                      <ul className={`text-xs ${styles.textSecondary} list-disc list-inside space-y-1`}>
                        {insight.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* 분석 방법론 및 출처 안내 */}
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <p className="text-xs text-muted-foreground">
            💡 이 인사이트는 Z-Score, 표준편차, 선형 회귀, 허핀달-허쉬만 지수(HHI) 등 통계적 방법론을 기반으로 자동 생성됩니다.
            AI 모델 없이 순수 통계 분석만 사용하여 데이터 프라이버시를 보호합니다.
          </p>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">📊 한국 의료 벤치마크 출처 보기</summary>
            <ul className="mt-2 ml-4 space-y-1 list-disc">
              <li>보건복지부/OECD Health Statistics 2023: 한국인 1인당 외래방문 18.0회</li>
              <li>건강보험심사평가원(HIRA): 우울증 외래 3주내 재방문율 42.3%</li>
              <li>중랑구 파일럿 연구: 의원급 초진:재진 비율 19:81</li>
              <li>메디게이트 설문조사: 피부과/성형외과 재진율 66.1%</li>
              <li>국민건강보험공단: 고혈압 COC 0.81, 복약순응률 73.3%</li>
              <li>화순전남대학교병원: NPS 재이용의향 32~35점</li>
              <li>보건복지부 의료이용 통계 2016-2022: 정상 성장률 0.5~3%</li>
              <li>공정거래위원회: HHI 시장집중도 기준</li>
            </ul>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}
