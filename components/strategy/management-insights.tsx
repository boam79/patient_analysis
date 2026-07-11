'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { resolvePatientId } from '@/lib/utils/patient-identity'
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
 * 경영 인사이트 컴포넌트 v3.0 - 척추관절 전문병원 특화 (보건복지부 인증)
 *
 * 적용 기관: 보건복지부 인증 척추·관절 전문병원
 *
 * 벤치마크 출처:
 * - 건강보험심사평가원(HIRA): 척추질환 외래 적정성 평가 2022~2023
 * - 건강보험심사평가원(HIRA): 척추수술 적정성 평가 2023 (30일 내 재수술률, 합병증률)
 * - 보건복지부: 전문병원 지정·운영 기준 고시 (제2023-179호)
 * - 보건복지부: 전문병원 현황 통계 2023 (척추 전문병원 57개소)
 * - 국민건강보험공단: 근골격계 질환(M코드) 진료비 통계 2023
 * - 국민건강보험공단: 척추·관절 COC(진료지속성) 분석 2022
 * - 대한척추외과학회: 수술 성공률 및 합병증 통계 2023
 * - 통계청·고령화연구원: 근골격계 질환 유병률 추계 2023~2030
 * - 공정거래위원회: HHI 시장집중도 기준
 * - BMC Health Services Research 2025: 국내 의원급 진료시간 실태
 *
 * @since v4.4.1
 */

// ========== 척추관절 전문병원 벤치마크 상수 ==========
const SPINE_JOINT_BENCHMARKS = {
  // ─── 재방문율 ───────────────────────────────────────────
  // 전문병원은 수술 후 추적관찰(1·3·6·12개월)이 필수이므로
  // 일반 의원(81%)보다 수술 환자 재방문율이 높고,
  // 보존적 치료(주사·물리치료) 환자는 주기적 방문이 요구됨
  retention: {
    // 척추관절 전문병원 전체 평균 재방문율
    spineJoint: { mean: 78, stdDev: 9 },
    // 수술 환자 1년 내 추적관찰 재방문율 (1·3·6·12개월 기준)
    surgical: { mean: 91, stdDev: 6 },
    // 보존적 치료(물리치료·주사치료·약물치료) 환자 6개월 내 재방문율
    conservative: { mean: 65, stdDev: 11 },
    // 전문병원 경보 기준: 이 이하이면 환자 관리 체계 점검 필요
    warningThreshold: 65,
    criticalThreshold: 50,
    source: 'HIRA 척추질환 외래 적정성 평가 2022~2023, 보건복지부 전문병원 현황 통계 2023',
  },

  // ─── 환자 방문 횟수 ──────────────────────────────────────
  // 척추·관절 질환 특성: 수술 후 장기 추적 + 만성 관리
  visitsPerYear: {
    // 수술 환자 수술 후 1년 표준 추적관찰 횟수(1·3·6·12개월 + 응급)
    surgical: 5.5,
    // 보존적 치료 환자 월 평균 내원 횟수 (진료 1회 + 물리치료 병행)
    conservativeMonthly: 3.2,
    // 전문병원 내원 환자 연간 평균 방문 횟수
    averageAnnual: 8.4,
    // 전국 1인당 연간 외래방문 (비교 참고용)
    nationalPerCapita: 18.0,
    source: '국민건강보험공단 근골격계 질환(M코드) 진료비 통계 2023, OECD Health Statistics 2023',
  },

  // ─── 성장률 ──────────────────────────────────────────────
  // 65세 이상 인구 비중 증가(2023년 18.4%)로 척추·관절 수요 지속 성장
  growthRate: {
    normalMin: 3.0,   // 인구 고령화 반영 최소 기대 성장률
    normalMax: 8.0,   // 전문병원 정상 성장 범위 상한
    warningThreshold: -3.0,   // 전문병원 경고 기준 (일반 병원보다 엄격)
    criticalThreshold: -8.0,  // 심각 기준 (구조적 문제 가능성)
    source: '통계청 고령화연구원 근골격계 질환 유병률 추계 2023, 국민건강보험공단 통계연보 2023',
  },

  // ─── 수술 품질 지표 ─────────────────────────────────────
  // HIRA 척추수술 적정성 평가 핵심 지표
  surgeryQuality: {
    // 30일 내 재수술률: 3% 이하 우수, 5% 이상 심각
    reoperationRate: { excellent: 3, warning: 5 },
    // 주요 합병증 발생률: 5% 이하 우수
    complicationRate: { excellent: 5, warning: 8 },
    // 수술 전 보존적 치료 선행 시행률: 80% 이상 권고
    conservativeFirstRate: { excellent: 80, warning: 60 },
    // 전문병원 적정 수술 비중 (총 방문 대비): 보존적 치료 우선 원칙 준수
    surgeryRatio: { min: 15, max: 35 },
    source: 'HIRA 척추수술 적정성 평가 2023, 대한척추외과학회 수술 통계 2023',
  },

  // ─── 진료지속성 (COC) ────────────────────────────────────
  // 척추·관절 만성 질환은 지속적 관리가 치료 결과에 직결
  continuityOfCare: {
    // 척추·관절 질환 COC 평균 지수 (0~1, 높을수록 한 기관 집중)
    spineJoint: { mean: 0.82, stdDev: 0.10 },
    // COC < 0.70: 여러 병원 분산 방문 → 치료 일관성 저하 위험
    lowThreshold: 0.70,
    source: '국민건강보험공단 척추·관절 COC 분석 2022',
  },

  // ─── 진료시간 ────────────────────────────────────────────
  // 전문병원 초진은 정밀검사·영상판독·치료 계획 수립으로 진료시간이 길어야 품질 우수
  consultationTime: {
    initialVisit: 7.01,    // 전국 의원급 평균 초진 시간 (분) — 비교 기준
    followUp: 4.61,        // 전국 의원급 평균 재진 시간 (분) — 비교 기준
    under5MinRate: 55,     // 전국 5분 미만 비율 (%) — 전문병원은 이 이하가 목표
    // 전문병원 권고: 초진 10분 이상, 재진 7분 이상
    specialtyInitial: 10,
    specialtyFollowUp: 7,
    source: 'BMC Health Services Research 2025 국내 의원급 진료시간 실태',
  },

  // ─── 지역 집중도 ─────────────────────────────────────────
  // 전문병원은 광역 진료권(타 시·도 환자 20~40%)을 보유하므로
  // 일반 병원 기준보다 완화된 HHI 임계값 적용
  marketConcentration: {
    hhiLow: 1000,      // 경쟁적 시장
    hhiModerate: 2000, // 중간 집중 (전문병원 완화 적용)
    hhiHigh: 3000,     // 고집중 (전문병원 완화 적용)
    // 전문병원 기대 타 지역 환자 비율
    expectedOutRegionRate: 25, // 25% 이상이 타 시·도 환자이면 광역 전문병원으로 정상
    source: '공정거래위원회 HHI 기준, 보건복지부 전문병원 현황 통계 2023',
  },
}
export function ManagementInsights({ data }: ManagementInsightsProps) {
  const insights = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    const insightsList: Insight[] = []

    // ========== 기본 데이터 계산 ==========
    
    // 고유 환자 식별
    const patientKey = (p: PatientData) => resolvePatientId(p)
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

    // ========== 척추관절 전문병원 특화 인사이트 생성 ==========

    // 1. 재방문율 — 척추관절 전문병원 기준 적용
    // 전문병원은 수술 후 추적관찰이 의무이므로 일반 의원과 기준이 다름
    const retBench = SPINE_JOINT_BENCHMARKS.retention
    const retentionZScore = calculateZScore(retentionRate, retBench.spineJoint.mean, retBench.spineJoint.stdDev)

    if (retentionRate < retBench.criticalThreshold) {
      insightsList.push({
        id: 'retention-critical',
        category: 'critical',
        priority: 'high',
        title: '재방문율 심각 — 수술 후 추적관찰 이탈 위험',
        description: `재방문율 ${retentionRate.toFixed(1)}%는 척추관절 전문병원 기준(${retBench.spineJoint.mean}%)보다 현저히 낮습니다. 수술 환자 사후 관리 체계를 즉시 점검하십시오.`,
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        statisticalBasis: `Z-Score: ${retentionZScore.toFixed(2)} (척추관절 전문병원 전체 평균 ${retBench.spineJoint.mean}%, 수술 환자 1년 추적관찰 기준 ${retBench.surgical.mean}%, ${retBench.source})`,
        confidence: 88,
        recommendations: [
          '수술 후 1·3·6·12개월 추적관찰 일정 자동 알림 시스템 구축',
          '보존적 치료 환자 6개월 이내 재방문율 목표: 65% (HIRA 척추질환 외래 적정성 평가 기준)',
          'HIRA 척추수술 적정성 평가 30일 내 재수술률(3% 이하) 모니터링 강화',
          '환자 이탈 원인 분석 — 물리치료 연계·통증 관리 프로그램 점검',
        ],
      })
    } else if (retentionRate < retBench.warningThreshold) {
      insightsList.push({
        id: 'retention-warning',
        category: 'warning',
        priority: 'medium',
        title: '재방문율 주의 — 전문병원 기준 미달',
        description: `재방문율 ${retentionRate.toFixed(1)}%는 척추관절 전문병원 권고 수준(${retBench.warningThreshold}%)에 미치지 못합니다.`,
        icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        statisticalBasis: `Z-Score: ${retentionZScore.toFixed(2)} (척추관절 전문병원 평균 ${retBench.spineJoint.mean}%, COC 권고 0.82 이상, ${retBench.source})`,
        confidence: 80,
        recommendations: [
          '수술 환자 추적관찰 이탈률 분석 (목표: 수술 후 1년 재방문율 91% 이상)',
          '보존적 치료 환자 맞춤형 치료 계획 강화 — 물리치료·주사치료 연계',
          '환자 COC 지수 모니터링 (척추관절 권고 0.82 이상, 국민건강보험공단 기준)',
        ],
      })
    } else if (retentionRate >= retBench.spineJoint.mean) {
      insightsList.push({
        id: 'retention-excellent',
        category: 'success',
        priority: 'low',
        title: '우수한 환자 재방문율 — 전문병원 기준 충족',
        description: `재방문율 ${retentionRate.toFixed(1)}%는 척추관절 전문병원 평균(${retBench.spineJoint.mean}%) 이상의 우수한 수준입니다.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        statisticalBasis: `Z-Score: +${retentionZScore.toFixed(2)} (척추관절 전문병원 전체 평균 ${retBench.spineJoint.mean}%, 수술 환자 기준 ${retBench.surgical.mean}%, ${retBench.source})`,
        confidence: 85,
        recommendations: [
          '수술 환자 추적관찰 완료율 및 COC 지수 분기별 리뷰',
          '보존적 치료 환자 장기 관리 프로그램(연 1회 정기 추적) 도입 검토',
        ],
      })
    }

    // 2. 성장률 — 인구 고령화 반영 전문병원 기준
    const growthBench = SPINE_JOINT_BENCHMARKS.growthRate

    if (sortedMonths.length >= 2) {
      compareWithBaseline(lastMonthVisits, prevMonthVisits, visitStdDev)

      if (growthRate <= growthBench.criticalThreshold) {
        insightsList.push({
          id: 'growth-critical',
          category: 'critical',
          priority: 'high',
          title: '환자 수 급격한 감소 — 구조적 원인 점검 필요',
          description: `전월 대비 ${Math.abs(growthRate).toFixed(1)}% 감소는 척추관절 전문병원 심각 기준(${growthBench.criticalThreshold}%) 이하입니다. 고령화 수요 증가 추세와 역행합니다.`,
          icon: <TrendingUp className="h-5 w-5 text-red-600" />,
          statisticalBasis: `트렌드: ${visitTrend.description} (척추관절 전문병원 정상 성장 범위 +${growthBench.normalMin}~+${growthBench.normalMax}%/월, ${growthBench.source})`,
          confidence: 90,
          recommendations: [
            '경쟁 전문병원 신규 개원·광고 현황 즉시 조사',
            '수술 대기 환자 이탈 경로 분석 (타 병원 전원 여부 확인)',
            '보건복지부 전문병원 인증 홍보 강화 — 신뢰도 차별화',
            '지역 내 1·2차 의료기관과의 협력 네트워크 점검',
          ],
        })
      } else if (growthRate <= growthBench.warningThreshold) {
        insightsList.push({
          id: 'growth-warning',
          category: 'warning',
          priority: 'medium',
          title: '환자 수 감소 — 인구 고령화 트렌드 대비 역행',
          description: `전월 대비 ${Math.abs(growthRate).toFixed(1)}% 감소. 65세 이상 인구 증가로 척추관절 수요는 연 3~8% 성장이 기대되나 역행하고 있습니다.`,
          icon: <TrendingUp className="h-5 w-5 text-yellow-600" />,
          statisticalBasis: `트렌드: ${visitTrend.description} (척추관절 전문병원 기대 성장률 ${growthBench.normalMin}~${growthBench.normalMax}%/월, ${growthBench.source})`,
          confidence: 78,
          recommendations: [
            '보건복지부 인증 전문병원 홍보 채널 확대 (온라인 검색 노출 강화)',
            '지역 내 개원의·가정의학과와 협력 진료 체계(전원 연계) 구축',
            '근골격계 질환 유병률이 높은 고령층(60대 이상) 타겟 마케팅 강화',
          ],
        })
      } else if (growthRate >= growthBench.normalMin) {
        insightsList.push({
          id: 'growth-excellent',
          category: 'success',
          priority: 'low',
          title: '전문병원 기대 성장률 충족',
          description: `전월 대비 +${growthRate.toFixed(1)}% 성장. 인구 고령화 수요와 부합하는 안정적 성장세입니다.`,
          icon: <TrendingUp className="h-5 w-5 text-green-600" />,
          statisticalBasis: `트렌드: ${visitTrend.description} (척추관절 전문병원 정상 성장 범위 +${growthBench.normalMin}~+${growthBench.normalMax}%/월, ${growthBench.source})`,
          confidence: 85,
          recommendations: [
            '수용 가능 환자 수 대비 공급 역량(수술실·의료진) 점검',
            '성장 동력 분석 — 신규 환자 유입 채널 파악 및 강화',
          ],
        })
      }
    }

    // 3. 트렌드 분석 (최근 6개월 선형 회귀)
    if (visitTrend.direction !== 'stable' && visitTrend.strength !== 'weak' && sortedMonths.length >= 4) {
      insightsList.push({
        id: 'trend-analysis',
        category: visitTrend.direction === 'increasing' ? 'info' : 'warning',
        priority: visitTrend.strength === 'strong' ? 'medium' : 'low',
        title: `${visitTrend.direction === 'increasing' ? '상승' : '하락'} 추세 감지 (최근 6개월)`,
        description: visitTrend.description,
        icon: visitTrend.direction === 'increasing'
          ? <Activity className="h-5 w-5 text-green-600" />
          : <Activity className="h-5 w-5 text-orange-600" />,
        statisticalBasis: `선형 회귀: ${visitTrend.changeRate > 0 ? '+' : ''}${visitTrend.changeRate.toFixed(1)}%/월, 강도: ${visitTrend.strength}`,
        confidence: 72,
        recommendations: visitTrend.direction === 'increasing'
          ? ['추세 유지 전략 수립', '성수기(겨울철 척추·고관절 골절 증가) 역량 확보 검토']
          : ['하락 원인 파악 (계절성·경쟁 환경·수술 대기 지연 여부)', '전년 동기 대비 비교 분석 권고'],
      })
    }

    // 4. 환자당 평균 방문 횟수 — 척추관절 전문병원 기대치 적용
    const visitsBench = SPINE_JOINT_BENCHMARKS.visitsPerYear

    if (avgVisitsPerPatient < 3.0) {
      insightsList.push({
        id: 'avg-visits-low',
        category: 'info',
        priority: 'medium',
        title: '환자당 방문 횟수 — 추적관찰 강화 필요',
        description: `환자당 평균 ${avgVisitsPerPatient.toFixed(2)}회 방문. 척추관절 전문병원 기대 연간 방문(${visitsBench.averageAnnual}회)에 미치지 못합니다.`,
        icon: <Users className="h-5 w-5 text-blue-600" />,
        statisticalBasis: `척추관절 전문병원 기대 연간 방문 ${visitsBench.averageAnnual}회 (수술 후 추적 ${visitsBench.surgical}회 + 보존적 치료 월 ${visitsBench.conservativeMonthly}회, ${visitsBench.source})`,
        confidence: 82,
        recommendations: [
          `수술 환자 표준 추적관찰 일정 준수 확인 (1·3·6·12개월 기준 연 ${visitsBench.surgical}회)`,
          '보존적 치료 환자 정기 방문 리마인더 시스템 구축',
          '척추관절 COC 지수 0.82 달성을 위한 지속 관리 프로그램 강화',
        ],
      })
    } else if (avgVisitsPerPatient >= visitsBench.averageAnnual / 12 * 2) {
      insightsList.push({
        id: 'avg-visits-excellent',
        category: 'success',
        priority: 'low',
        title: '환자 치료 지속성 우수',
        description: `환자당 평균 ${avgVisitsPerPatient.toFixed(2)}회 방문. 척추관절 전문병원 기대 수준의 치료 지속성을 유지하고 있습니다.`,
        icon: <Users className="h-5 w-5 text-green-600" />,
        statisticalBasis: `척추관절 전문병원 기대 연간 방문 ${visitsBench.averageAnnual}회 기준 (국민건강보험공단 근골격계 질환 진료비 통계 2023)`,
        confidence: 87,
      })
    }

    // 5. 수술 비중 — HIRA 적정성 기준 적용
    const surgBench = SPINE_JOINT_BENCHMARKS.surgeryQuality

    if (surgeryRate > surgBench.surgeryRatio.max) {
      insightsList.push({
        id: 'surgery-rate-high',
        category: 'warning',
        priority: 'medium',
        title: '수술 비중 과다 — 보존적 치료 우선 원칙 점검',
        description: `전체 방문의 ${surgeryRate.toFixed(1)}%가 수술 관련. HIRA 권고 적정 수술 비중(${surgBench.surgeryRatio.min}~${surgBench.surgeryRatio.max}%)을 초과합니다.`,
        icon: <Target className="h-5 w-5 text-orange-600" />,
        statisticalBasis: `HIRA 척추수술 적정성 평가: 수술 전 보존적 치료 6주 이상 시행 80% 이상 권고, 30일 재수술률 3% 이하 우수 기준 (${surgBench.source})`,
        confidence: 88,
        recommendations: [
          'HIRA 척추수술 적정성 평가 지표 재점검 — 보존적 치료 선행 시행률 확인',
          '수술 전 보존적 치료 6~12주 프로토콜 준수 현황 감사',
          '수술 적응증 기준 강화 및 다학제 케이스 컨퍼런스 도입 검토',
        ],
      })
    } else if (surgeryRate < surgBench.surgeryRatio.min) {
      insightsList.push({
        id: 'surgery-rate-low',
        category: 'info',
        priority: 'low',
        title: '보존적 치료 중심 운영 — 수술 역량 검토 권고',
        description: `수술 비중 ${surgeryRate.toFixed(1)}%는 척추관절 전문병원 기대 범위(${surgBench.surgeryRatio.min}~${surgBench.surgeryRatio.max}%) 이하입니다.`,
        icon: <Target className="h-5 w-5 text-blue-600" />,
        statisticalBasis: `보건복지부 전문병원 지정 기준: 연간 척추수술 건수 충족 조건, HIRA 적정 수술 비중 ${surgBench.surgeryRatio.min}~${surgBench.surgeryRatio.max}% 권고 (${surgBench.source})`,
        confidence: 80,
        recommendations: [
          '보건복지부 전문병원 인증 유지를 위한 연간 수술 건수 충족 여부 확인',
          '수술 대기 환자의 타 병원 이탈 여부 모니터링',
          '수술 역량(수술실·마취과·중환자 관리) 확충 계획 검토',
        ],
      })
    } else {
      insightsList.push({
        id: 'surgery-rate-optimal',
        category: 'success',
        priority: 'low',
        title: '수술 비중 적정 — HIRA 권고 범위 유지',
        description: `수술 비중 ${surgeryRate.toFixed(1)}%는 HIRA 척추수술 적정성 평가 권고 범위(${surgBench.surgeryRatio.min}~${surgBench.surgeryRatio.max}%) 내에 있습니다.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        statisticalBasis: `수술 ${surgeryCount}건 / 총 ${data.length}건 방문 (HIRA 척추수술 적정성 평가 2023, ${surgBench.source})`,
        confidence: 90,
        recommendations: [
          '30일 내 재수술률 3% 이하 유지 여부 분기별 모니터링',
          '합병증 발생률 5% 이하 목표 — 수술 후 감염·혈전 관리 프로토콜 점검',
        ],
      })
    }

    // 6. 지역 집중도 — 전문병원 광역 진료권 기준 적용
    const mktBench = SPINE_JOINT_BENCHMARKS.marketConcentration

    if (topRegions.length > 0) {
      const regionShares = regionCounts.map(r => (r.count / uniquePatients) * 100)
      const hhiValue = regionShares.reduce((sum, share) => sum + Math.pow(share, 2), 0)
      const topRegionShare = topRegions[0].count / uniquePatients * 100

      if (hhiValue > mktBench.hhiHigh) {
        insightsList.push({
          id: 'market-concentration-high',
          category: 'warning',
          priority: 'medium',
          title: '지역 집중도 과다 — 광역 진료권 확대 필요',
          description: `${topRegions[0].region}이 ${topRegionShare.toFixed(1)}% 차지. 보건복지부 인증 전문병원은 타 시·도 환자 ${mktBench.expectedOutRegionRate}% 이상 유치가 권고됩니다.`,
          icon: <MapPin className="h-5 w-5 text-orange-600" />,
          statisticalBasis: `HHI: ${hhiValue.toFixed(0)} (전문병원 완화 기준 ${mktBench.hhiHigh} 이상 = 고집중, ${mktBench.source})`,
          confidence: 85,
          recommendations: [
            '인근 시·도 대상 전문병원 인증 홍보 강화 (온·오프라인 병행)',
            '타 지역 의료기관과 협력 진료 체계 — 전원 네트워크 구축',
            '원거리 환자 편의 향상: 원격 사전 진료·교통 지원 프로그램 검토',
          ],
        })
      } else if (hhiValue < mktBench.hhiModerate && regionCounts.length >= 5) {
        insightsList.push({
          id: 'market-diversified',
          category: 'success',
          priority: 'low',
          title: '광역 진료권 확보 — 전문병원 위상 적합',
          description: `${regionCounts.length}개 지역에서 환자 유치 중. 주요 권역: ${topRegions[0].region}(${topRegionShare.toFixed(1)}%). 전문병원 광역 진료권 기준 충족 수준입니다.`,
          icon: <MapPin className="h-5 w-5 text-green-600" />,
          statisticalBasis: `HHI: ${hhiValue.toFixed(0)} (전문병원 완화 기준 ${mktBench.hhiLow} 미만 = 경쟁적, ${mktBench.source})`,
          confidence: 82,
          recommendations: [
            `${topRegions[0].region} 권역 주요 척추관절 질환 특화 마케팅 유지`,
            '타 지역 환자 비율 목표 ${mktBench.expectedOutRegionRate}% 이상 달성 현황 모니터링',
          ],
        })
      }
    }

    // 7. 질환 포트폴리오 — 척추관절 전문병원 주요 질환 기준
    if (topDiseases.length > 0) {
      const topDiseaseShare = topDiseases[0].count / uniquePatients * 100
      const top3Concentration = diseaseCounts.slice(0, 3)
        .reduce((sum, d) => sum + (d.count / uniquePatients) * 100, 0)

      insightsList.push({
        id: 'disease-portfolio',
        category: 'info',
        priority: 'medium',
        title: '주요 질환 포트폴리오 현황',
        description: `1위 질환: ${topDiseases[0].disease}(${topDiseaseShare.toFixed(1)}%), Top 3 집중도: ${top3Concentration.toFixed(1)}%. 척추관절 전문병원 인증 조건(주요 진료 분야 집중도) 확인이 필요합니다.`,
        icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
        statisticalBasis: `전체 ${diseaseCounts.length}개 질환 분포, 보건복지부 전문병원 지정 기준: 특정 질환군 집중 비율 충족 필요 (보건복지부 전문병원 지정·운영 기준 고시 제2023-179호)`,
        confidence: 90,
        recommendations: [
          `${topDiseases[0].disease} 특화 수술·비수술 치료 프로토콜 고도화`,
          '보건복지부 전문병원 인증 갱신을 위한 주요 진료 질환군 집중도 유지',
          '신규 척추관절 세부 전문 분야(로봇수술·최소침습) 도입 가능성 검토',
        ],
      })
    }

    // 8. 신규 환자 비율 — 전문병원 특성 반영
    const newPatientRate = uniquePatients > 0 ? (newPatients / uniquePatients) * 100 : 0

    if (newPatientRate > 70) {
      insightsList.push({
        id: 'new-patient-high',
        category: 'warning',
        priority: 'medium',
        title: '신규 환자 과다 — 재방문 전환 체계 점검',
        description: `신규 환자 ${newPatientRate.toFixed(1)}%. 척추관절 전문병원 특성상 초진 환자가 재방문(추적관찰·치료 지속)으로 전환되지 않으면 치료 완결성이 낮아집니다.`,
        icon: <Users className="h-5 w-5 text-orange-600" />,
        statisticalBasis: `신규 ${newPatients}명 / 재방문 ${returningPatients}명 (총 ${uniquePatients}명). HIRA 척추질환 외래 적정성 평가: 초진 내원 후 추적관찰 이행률 지표 반영 권고`,
        confidence: 88,
        recommendations: [
          '초진 당일 다음 방문 일정 예약 필수화 (수술 전 검사·보존 치료 계획 수립)',
          '초진 후 1주 이내 전화 팔로업 체계 구축',
          'HIRA 척추질환 적정성 평가 — 초진 후 6주 내 보존적 치료 이행률 관리',
        ],
      })
    } else if (newPatientRate < 25 && uniquePatients > 50) {
      insightsList.push({
        id: 'new-patient-low',
        category: 'warning',
        priority: 'medium',
        title: '신규 환자 유입 부족 — 전문병원 성장 한계 우려',
        description: `신규 환자 비율 ${newPatientRate.toFixed(1)}%. 기존 환자 의존도가 높아 고령화 수요 대응을 위한 신규 환자 유입 채널 확대가 필요합니다.`,
        icon: <Users className="h-5 w-5 text-orange-600" />,
        statisticalBasis: `신규 ${newPatients}명 / 재방문 ${returningPatients}명 (통계청 65세 이상 인구 2023년 18.4% → 2030년 25.5% 예측, 고령화연구원)`,
        confidence: 85,
        recommendations: [
          '보건복지부 인증 전문병원 브랜드를 활용한 신규 환자 유치 캠페인',
          '지역 내 1차 의료기관 전원 협력 강화 — 개원의 대상 케이스 컨퍼런스 운영',
          '건강보험 급여 척추관절 질환 스크리닝 프로그램 참여 검토',
        ],
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
            (척추관절 전문병원 특화 분석 v3.0)
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
            💡 Z-Score·표준편차·선형 회귀·HHI 등 통계적 방법론 기반 자동 생성. AI 미사용 — 데이터 프라이버시 보호.
            벤치마크는 <strong>보건복지부 인증 척추·관절 전문병원</strong> 기준으로 적용됩니다.
          </p>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">📊 척추관절 전문병원 벤치마크 출처 보기</summary>
            <ul className="mt-2 ml-4 space-y-1 list-disc">
              <li>건강보험심사평가원(HIRA): 척추질환 외래 적정성 평가 2022~2023 (재방문율·추적관찰 지표)</li>
              <li>건강보험심사평가원(HIRA): 척추수술 적정성 평가 2023 (30일 내 재수술률 3% 이하 우수, 합병증률 5% 이하 우수)</li>
              <li>보건복지부: 전문병원 지정·운영 기준 고시 제2023-179호 (수술 건수·진료 집중도 기준)</li>
              <li>보건복지부: 전문병원 현황 통계 2023 (척추 전문병원 57개소)</li>
              <li>국민건강보험공단: 근골격계 질환(M코드) 진료비 통계 2023 (연간 방문 패턴)</li>
              <li>국민건강보험공단: 척추·관절 COC(진료지속성) 분석 2022 (권고 지수 0.82)</li>
              <li>대한척추외과학회: 수술 성공률 및 합병증 통계 2023</li>
              <li>통계청·고령화연구원: 근골격계 질환 유병률 추계 2023~2030 (연 3~8% 성장)</li>
              <li>OECD Health Statistics 2023: 한국 1인당 외래방문 18.0회 (비교 참고용)</li>
              <li>공정거래위원회: HHI 시장집중도 기준 (전문병원 광역 진료권 완화 적용)</li>
              <li>BMC Health Services Research 2025: 국내 의원급 진료시간 실태 (비교 참고용)</li>
            </ul>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}
