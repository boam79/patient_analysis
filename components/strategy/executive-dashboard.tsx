'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { resolvePatientId } from '@/lib/utils/patient-identity'
import { Users, TrendingUp, MapPin, Calendar, AlertCircle } from 'lucide-react'
import { extractMonth, parseDate } from '@/lib/utils/date-helpers'

interface ExecutiveDashboardProps {
  data: PatientData[]
}

export function ExecutiveDashboard({ data }: ExecutiveDashboardProps) {
  // 핵심 경영 지표 계산
  const metrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalVisits: 0,
        uniquePatients: 0,
        newPatients: 0,
        returningPatients: 0,
        retentionRate: 0,
        topRegions: [],
        topDiseases: [],
        growthRate: 0,
        avgVisitsPerPatient: 0,
      }
    }

    // 고유 환자 식별 (이름+주소 기준) - 메인 대시보드 KPI 로직과 동일하게 맞춤
    const patientKey = (p: PatientData) => resolvePatientId(p)

    const uniquePatientKeys = new Set(data.map(patientKey))
    const uniquePatients = uniquePatientKeys.size

    // 환자별 방문 횟수
    const patientVisitCounts = new Map<string, number>()
    data.forEach(p => {
      const key = patientKey(p)
      patientVisitCounts.set(key, (patientVisitCounts.get(key) || 0) + 1)
    })

    // 신규 환자 (1회 방문만)
    const newPatients = Array.from(patientVisitCounts.values()).filter(count => count === 1).length
    
    // 재방문 환자 (2회 이상)
    const returningPatients = Array.from(patientVisitCounts.values()).filter(count => count > 1).length

    // 재방문율
    const retentionRate = uniquePatients > 0 ? (returningPatients / uniquePatients) * 100 : 0

    // 환자당 평균 방문 횟수
    const avgVisitsPerPatient = uniquePatients > 0 ? data.length / uniquePatients : 0

    // 지역별 고유 환자 수 (이름+주소 기준)
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

    // 질병별 고유 환자 수 (이름+주소 기준)
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

    // 성장률 계산 (월별 환자 수 비교)
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

    return {
      totalVisits: data.length,
      uniquePatients,
      newPatients,
      returningPatients,
      retentionRate,
      topRegions,
      topDiseases,
      growthRate,
      avgVisitsPerPatient,
    }
  }, [data])

  return (
    <div className="space-y-6">
      {/* 핵심 지표 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 방문 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalVisits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              고유 환자: {metrics.uniquePatients.toLocaleString()}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">재방문율</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.retentionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              재방문: {metrics.returningPatients}명 | 신규: {metrics.newPatients}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">환자당 평균 방문</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgVisitsPerPatient.toFixed(1)}회</div>
            <p className="text-xs text-muted-foreground">
              장기 고객 지표
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">성장률</CardTitle>
            {metrics.growthRate >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.growthRate >= 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              전월 대비 환자 수 변화
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 상세 분석 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 주요 지역 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              주요 지역 Top 5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topRegions.length > 0 ? (
                metrics.topRegions.map((item, index) => (
                  <div key={item.region} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">{item.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(item.count / metrics.topRegions[0].count) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 주요 질병 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              주요 질병 Top 5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topDiseases.length > 0 ? (
                metrics.topDiseases.map((item, index) => (
                  <div key={item.disease} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">{item.disease}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(item.count / metrics.topDiseases[0].count) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

