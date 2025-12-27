'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { AlertCircle, CheckCircle2, TrendingUp, Users, MapPin, Target, Lightbulb } from 'lucide-react'
import { extractMonth } from '@/lib/utils/date-helpers'

interface ManagementInsightsProps {
  data: PatientData[]
}

type InsightCategory = 'warning' | 'info' | 'success'
type InsightPriority = 'high' | 'medium' | 'low'

interface Insight {
  id: string
  category: InsightCategory
  priority: InsightPriority
  title: string
  description: string
  icon: React.ReactNode
  recommendations?: string[]
}

export function ManagementInsights({ data }: ManagementInsightsProps) {
  const insights = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    const insightsList: Insight[] = []

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

    const newPatients = Array.from(patientVisitCounts.values()).filter(count => count === 1).length
    const returningPatients = Array.from(patientVisitCounts.values()).filter(count => count > 1).length
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
    const topRegions = Array.from(regionPatients.entries())
      .map(([region, patients]) => ({ region, count: patients.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

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
    const topDiseases = Array.from(diseasePatients.entries())
      .map(([disease, patients]) => ({ disease, count: patients.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 성장률 계산
    const monthlyVisits = new Map<string, number>()
    data.forEach(p => {
      const month = extractMonth(p.visit_date)
      if (month) {
        monthlyVisits.set(month, (monthlyVisits.get(month) || 0) + 1)
      }
    })
    const sortedMonths = Array.from(monthlyVisits.entries()).sort()
    let growthRate = 0
    if (sortedMonths.length >= 2) {
      const lastMonth = sortedMonths[sortedMonths.length - 1][1]
      const prevMonth = sortedMonths[sortedMonths.length - 2][1]
      growthRate = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0
    }

    // 수술 건수 분석
    const surgeryCount = data.filter(p => p.surgery_name).length
    const surgeryRate = data.length > 0 ? (surgeryCount / data.length) * 100 : 0

    // ========== 인사이트 생성 ==========

    // 1. 환자 유지 관련 인사이트
    if (retentionRate < 20) {
      insightsList.push({
        id: 'retention-low',
        category: 'warning',
        priority: 'high',
        title: '재방문율이 매우 낮습니다',
        description: `재방문율이 ${retentionRate.toFixed(1)}%로 매우 낮습니다. 환자 유지 전략이 시급히 필요합니다.`,
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        recommendations: [
          '첫 방문 후 추적 관리 시스템 구축',
          '재방문 인센티브 프로그램 도입 검토',
          '환자 만족도 조사 및 개선 활동 실시'
        ]
      })
    } else if (retentionRate < 30) {
      insightsList.push({
        id: 'retention-medium',
        category: 'warning',
        priority: 'medium',
        title: '재방문율 개선 여지가 있습니다',
        description: `재방문율이 ${retentionRate.toFixed(1)}%입니다. 목표치인 30% 이상을 달성하기 위한 전략 수립이 필요합니다.`,
        icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        recommendations: [
          '환자별 맞춤형 추적 시스템 도입',
          '정기적인 건강 관리 프로그램 제안'
        ]
      })
    } else if (retentionRate >= 40) {
      insightsList.push({
        id: 'retention-good',
        category: 'success',
        priority: 'low',
        title: '우수한 환자 유지율',
        description: `재방문율이 ${retentionRate.toFixed(1)}%로 우수합니다. 현재 환자 유지 전략이 효과적입니다.`,
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        recommendations: [
          '현재 전략 유지 및 미세 조정',
          '모범 사례를 다른 지역으로 확장 검토'
        ]
      })
    }

    // 2. 성장 관련 인사이트
    if (growthRate < -10) {
      insightsList.push({
        id: 'growth-severe',
        category: 'warning',
        priority: 'high',
        title: '환자 수 급격한 감소',
        description: `전월 대비 환자 수가 ${Math.abs(growthRate).toFixed(1)}% 감소했습니다. 즉각적인 대응이 필요합니다.`,
        icon: <TrendingUp className="h-5 w-5 text-red-600" />,
        recommendations: [
          '마케팅 예산 증액 및 캠페인 강화',
          '경쟁사 분석 및 차별화 전략 수립',
          '신규 환자 유치 프로그램 즉시 실행'
        ]
      })
    } else if (growthRate < 0) {
      insightsList.push({
        id: 'growth-negative',
        category: 'warning',
        priority: 'medium',
        title: '환자 수 감소 추세',
        description: `전월 대비 환자 수가 ${Math.abs(growthRate).toFixed(1)}% 감소했습니다. 마케팅 강화가 필요합니다.`,
        icon: <TrendingUp className="h-5 w-5 text-yellow-600" />,
        recommendations: [
          '온라인/오프라인 마케팅 활동 확대',
          '신규 환자 유치 프로그램 검토'
        ]
      })
    } else if (growthRate > 10) {
      insightsList.push({
        id: 'growth-positive',
        category: 'success',
        priority: 'low',
        title: '강한 성장세',
        description: `전월 대비 환자 수가 ${growthRate.toFixed(1)}% 증가했습니다. 현재 성장 추세가 지속되고 있습니다.`,
        icon: <TrendingUp className="h-5 w-5 text-green-600" />,
        recommendations: [
          '성장 요인 분석 및 재현 전략 수립',
          '인프라 확장 계획 검토'
        ]
      })
    }

    // 3. 환자당 평균 방문 관련
    if (avgVisitsPerPatient < 1.2) {
      insightsList.push({
        id: 'avg-visits-low',
        category: 'info',
        priority: 'medium',
        title: '환자당 평균 방문 수 낮음',
        description: `환자당 평균 방문 수가 ${avgVisitsPerPatient.toFixed(1)}회로 낮습니다. 장기 치료 관리가 필요한 환자들의 추적이 필요합니다.`,
        icon: <Users className="h-5 w-5 text-blue-600" />,
        recommendations: [
          '만성 질환 관리 프로그램 강화',
          '정기 검진 일정 관리 시스템 도입'
        ]
      })
    } else if (avgVisitsPerPatient >= 2.0) {
      insightsList.push({
        id: 'avg-visits-good',
        category: 'success',
        priority: 'low',
        title: '환자 관계 관리 우수',
        description: `환자당 평균 방문 수가 ${avgVisitsPerPatient.toFixed(1)}회로 우수합니다. 환자와의 장기적인 관계 유지가 잘 되고 있습니다.`,
        icon: <Users className="h-5 w-5 text-green-600" />,
      })
    }

    // 4. 시장 기회 관련 인사이트
    if (topRegions.length > 0) {
      const topRegionShare = topRegions[0].count / uniquePatients * 100
      if (topRegionShare > 30) {
        insightsList.push({
          id: 'market-concentration',
          category: 'info',
          priority: 'medium',
          title: '지역 집중도 높음',
          description: `${topRegions[0].region} 지역이 전체 환자의 ${topRegionShare.toFixed(1)}%를 차지합니다. 지역 확대 전략 검토가 필요합니다.`,
          icon: <MapPin className="h-5 w-5 text-blue-600" />,
          recommendations: [
            '주요 지역 이외 지역 마케팅 확대',
            '접근성 개선을 위한 병원 위치 검토'
          ]
        })
      } else {
        insightsList.push({
          id: 'market-diversified',
          category: 'success',
          priority: 'low',
          title: '다양한 지역에서 환자 유치',
          description: `${topRegions[0].region} 지역이 주요 시장입니다. 이 지역에 집중 마케팅을 강화하면 성과를 높일 수 있습니다.`,
          icon: <MapPin className="h-5 w-5 text-green-600" />,
          recommendations: [
            `${topRegions[0].region} 지역 집중 마케팅 캠페인 실시`,
            'Top 3 지역에 지역별 맞춤 전략 수립'
          ]
        })
      }
    }

    // 5. 질병 전략 관련 인사이트
    if (topDiseases.length > 0) {
      const topDiseaseShare = topDiseases[0].count / uniquePatients * 100
      insightsList.push({
        id: 'disease-strategy',
        category: 'info',
        priority: 'medium',
        title: '주요 질병 중심 전략',
        description: `${topDiseases[0].disease}가 전체 환자의 ${topDiseaseShare.toFixed(1)}%를 차지합니다. 해당 질병 전문성 강화가 효과적일 수 있습니다.`,
        icon: <Target className="h-5 w-5 text-blue-600" />,
        recommendations: [
          `${topDiseases[0].disease} 전문 진료 프로그램 강화`,
          'Top 3 질병에 대한 맞춤형 치료 프로토콜 개발'
        ]
      })
    }

    // 6. 수술률 관련 인사이트
    if (surgeryRate > 30) {
      insightsList.push({
        id: 'surgery-rate-high',
        category: 'info',
        priority: 'medium',
        title: '높은 수술률',
        description: `전체 방문의 ${surgeryRate.toFixed(1)}%가 수술 관련입니다. 수술 전문성과 시설 투자가 효과적일 수 있습니다.`,
        icon: <Target className="h-5 w-5 text-blue-600" />,
        recommendations: [
          '수술 전문 장비 및 시설 투자 검토',
          '수술 후 관리 프로그램 강화'
        ]
      })
    }

    // 7. 신규 환자 비율 관련
    const newPatientRate = uniquePatients > 0 ? (newPatients / uniquePatients) * 100 : 0
    if (newPatientRate > 80) {
      insightsList.push({
        id: 'new-patient-high',
        category: 'info',
        priority: 'medium',
        title: '높은 신규 환자 비율',
        description: `신규 환자가 전체의 ${newPatientRate.toFixed(1)}%를 차지합니다. 신규 환자 관리 시스템 강화가 필요합니다.`,
        icon: <Users className="h-5 w-5 text-blue-600" />,
        recommendations: [
          '신규 환자 오리엔테이션 프로그램 개발',
          '첫 방문 후 재방문 유도 시스템 구축'
        ]
      })
    }

    // 우선순위 및 카테고리별 정렬
    const priorityOrder: Record<InsightPriority, number> = { high: 3, medium: 2, low: 1 }
    const categoryOrder: Record<InsightCategory, number> = { warning: 3, info: 2, success: 1 }

    return insightsList.sort((a, b) => {
      // 우선순위가 같으면 카테고리로 정렬
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
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          textSecondary: 'text-yellow-700',
        }
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          textSecondary: 'text-blue-700',
        }
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-900',
          textSecondary: 'text-green-700',
        }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          경영 인사이트
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => {
            const styles = getCategoryStyles(insight.category)
            return (
              <div
                key={insight.id}
                className={`flex items-start gap-3 p-4 ${styles.bg} ${styles.border} border rounded-lg`}
              >
                <div className="mt-0.5">{insight.icon}</div>
                <div className="flex-1">
                  <p className={`font-semibold ${styles.text}`}>{insight.title}</p>
                  <p className={`text-sm ${styles.textSecondary} mt-1.5`}>
                    {insight.description}
                  </p>
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
      </CardContent>
    </Card>
  )
}
