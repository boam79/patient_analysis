'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { resolvePatientId } from '@/lib/utils/patient-identity'
import { hasSurgery } from '@/lib/utils/analysis-helpers'
import { computeDiseaseRecurrenceRates } from '@/lib/utils/monthly-trend'
import {
  isReturningWithinWindow,
  DEFAULT_STRATEGY_WINDOW,
} from '@/lib/utils/strategy-metrics'
import { groupVisitsByPatient } from '@/lib/utils/patient-identity'

interface DiseaseSurgeryStrategyProps {
  data: PatientData[]
  windowSize?: number
}

function surgeryLabel(p: PatientData): string {
  return (
    p.surgery_name?.toString().trim() ||
    p.surgery_code?.toString().trim() ||
    ''
  )
}

export function DiseaseSurgeryStrategy({
  data,
  windowSize = DEFAULT_STRATEGY_WINDOW,
}: DiseaseSurgeryStrategyProps) {
  const analysis = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        diseaseStats: [],
        surgeryStats: [],
        diseaseSurgeryMatrix: [],
        diseaseRetention: [],
        surgeryRetention: [],
      }
    }

    // 질병별 통계
    const diseaseStats = new Map<string, {
      count: number
      uniquePatients: Set<string>
      withSurgery: number
      avgAge: number
      ageSum: number
      ageCount: number
    }>()

    // 수술별 통계
    const surgeryStats = new Map<string, {
      count: number
      uniquePatients: Set<string>
      diseases: Set<string>
    }>()

    // 질병-수술 매트릭스
    const diseaseSurgeryMatrix = new Map<string, Map<string, number>>()

    data.forEach(p => {
      const id = resolvePatientId(p)

      // 질병별 통계
      if (!diseaseStats.has(p.disease_name)) {
        diseaseStats.set(p.disease_name, {
          count: 0,
          uniquePatients: new Set(),
          withSurgery: 0,
          avgAge: 0,
          ageSum: 0,
          ageCount: 0,
        })
      }
      const diseaseStat = diseaseStats.get(p.disease_name)!
      diseaseStat.count++
      diseaseStat.uniquePatients.add(id)
      if (hasSurgery(p)) {
        diseaseStat.withSurgery++
      }
      diseaseStat.ageSum += p.age
      diseaseStat.ageCount++

      // 수술별 통계
      const sLabel = surgeryLabel(p)
      if (hasSurgery(p) && sLabel) {
        if (!surgeryStats.has(sLabel)) {
          surgeryStats.set(sLabel, {
            count: 0,
            uniquePatients: new Set(),
            diseases: new Set(),
          })
        }
        const surgeryStat = surgeryStats.get(sLabel)!
        surgeryStat.count++
        surgeryStat.uniquePatients.add(id)
        surgeryStat.diseases.add(p.disease_name)

        // 질병-수술 매트릭스
        if (!diseaseSurgeryMatrix.has(p.disease_name)) {
          diseaseSurgeryMatrix.set(p.disease_name, new Map())
        }
        const matrix = diseaseSurgeryMatrix.get(p.disease_name)!
        matrix.set(sLabel, (matrix.get(sLabel) || 0) + 1)
      }
    })

    // 질병별 통계 배열
    const diseaseStatsArray = Array.from(diseaseStats.entries())
      .map(([disease, stat]) => ({
        disease,
        count: stat.count,
        uniquePatients: stat.uniquePatients.size,
        withSurgery: stat.withSurgery,
        surgeryRate: stat.count > 0 ? (stat.withSurgery / stat.count) * 100 : 0,
        avgAge: stat.ageCount > 0 ? stat.ageSum / stat.ageCount : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // 수술별 통계 배열
    const surgeryStatsArray = Array.from(surgeryStats.entries())
      .map(([surgery, stat]) => ({
        surgery,
        count: stat.count,
        uniquePatients: stat.uniquePatients.size,
        diseaseCount: stat.diseases.size,
      }))
      .sort((a, b) => b.count - a.count)

    // 질병-수술 매트릭스 배열
    const matrixArray: Array<{ disease: string; surgery: string; count: number }> = []
    diseaseSurgeryMatrix.forEach((surgeries, disease) => {
      surgeries.forEach((count, surgery) => {
        matrixArray.push({ disease, surgery, count })
      })
    })

    // 환자별 방문 횟수 (재방문율 계산용)
    const patientVisitCounts = new Map<string, number>()
    const patientDiseases = new Map<string, Set<string>>()
    const patientSurgeries = new Map<string, Set<string>>()

    data.forEach(p => {
      const id = resolvePatientId(p)
      patientVisitCounts.set(id, (patientVisitCounts.get(id) || 0) + 1)
      
      if (!patientDiseases.has(id)) {
        patientDiseases.set(id, new Set())
      }
      patientDiseases.get(id)!.add(p.disease_name)
      
      if (hasSurgery(p)) {
        const sLabel = surgeryLabel(p)
        if (sLabel) {
          if (!patientSurgeries.has(id)) {
            patientSurgeries.set(id, new Set())
          }
          patientSurgeries.get(id)!.add(sLabel)
        }
      }
    })

    // 질병별 재방문율 (윈도우 — 대시보드와 동일)
    const diseaseRates = computeDiseaseRecurrenceRates(data, windowSize)
    const visitsByPatient = groupVisitsByPatient(data)
    const diseaseTotals = new Map<string, number>()
    visitsByPatient.forEach((visits) => {
      const primary = visits[0]?.disease_name
      if (!primary) return
      diseaseTotals.set(primary, (diseaseTotals.get(primary) || 0) + 1)
    })

    const diseaseRetentionArray = Array.from(diseaseTotals.entries())
      .map(([disease, total]) => ({
        disease,
        retentionRate: diseaseRates.get(disease) || 0,
        total,
        returning: Math.round(((diseaseRates.get(disease) || 0) / 100) * total),
      }))
      .sort((a, b) => b.total - a.total)

    // 수술별 재방문율 (해당 수술 경험 환자, 윈도우)
    const surgeryRetention = new Map<string, { total: number; returning: number }>()
    visitsByPatient.forEach((visits, patientId) => {
      const surgeries = patientSurgeries.get(patientId)
      if (!surgeries || surgeries.size === 0) return
      const returned = isReturningWithinWindow(visits, windowSize)
      surgeries.forEach((surgery) => {
        if (!surgeryRetention.has(surgery)) {
          surgeryRetention.set(surgery, { total: 0, returning: 0 })
        }
        const stat = surgeryRetention.get(surgery)!
        stat.total++
        if (returned) stat.returning++
      })
    })

    const surgeryRetentionArray = Array.from(surgeryRetention.entries())
      .map(([surgery, stat]) => ({
        surgery,
        retentionRate: stat.total > 0 ? (stat.returning / stat.total) * 100 : 0,
        total: stat.total,
        returning: stat.returning,
      }))
      .sort((a, b) => b.total - a.total)

    return {
      diseaseStats: diseaseStatsArray,
      surgeryStats: surgeryStatsArray,
      diseaseSurgeryMatrix: matrixArray,
      diseaseRetention: diseaseRetentionArray,
      surgeryRetention: surgeryRetentionArray,
    }
  }, [data, windowSize])

  return (
    <div className="space-y-6">
      {/* 질병별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>질병별 통계 Top 10</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">질병</th>
                  <th className="text-right p-2">총 방문</th>
                  <th className="text-right p-2">고유 환자</th>
                  <th className="text-right p-2">수술 건수</th>
                  <th className="text-right p-2">수술률</th>
                  <th className="text-right p-2">평균 연령</th>
                </tr>
              </thead>
              <tbody>
                {analysis.diseaseStats.slice(0, 10).map((stat) => (
                  <tr key={stat.disease} className="border-b">
                    <td className="p-2 font-medium">{stat.disease}</td>
                    <td className="p-2 text-right">{stat.count.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.uniquePatients.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.withSurgery.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.surgeryRate.toFixed(1)}%</td>
                    <td className="p-2 text-right">{stat.avgAge.toFixed(1)}세</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 질병별 재방문율 */}
      <Card>
        <CardHeader>
          <CardTitle>질병별 재방문율 Top 10 ({windowSize}일 윈도우)</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.diseaseRetention.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.diseaseRetention.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="disease" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="retentionRate" fill="#82ca9d" name="재방문율 (%)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 수술별 재방문율 */}
      <Card>
        <CardHeader>
          <CardTitle>수술별 재방문율 ({windowSize}일 윈도우)</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.surgeryRetention.length === 0 ? (
            <p className="text-sm text-muted-foreground">수술 데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.surgeryRetention.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="surgery" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="retentionRate" fill="#8884d8" name="재방문율 (%)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 수술별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>수술별 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">수술</th>
                  <th className="text-right p-2">총 건수</th>
                  <th className="text-right p-2">고유 환자</th>
                  <th className="text-right p-2">관련 질병 수</th>
                </tr>
              </thead>
              <tbody>
                {analysis.surgeryStats.map((stat) => (
                  <tr key={stat.surgery} className="border-b">
                    <td className="p-2 font-medium">{stat.surgery}</td>
                    <td className="p-2 text-right">{stat.count.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.uniquePatients.toLocaleString()}</td>
                    <td className="p-2 text-right">{stat.diseaseCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 질병-수술 매트릭스 */}
      <Card>
        <CardHeader>
          <CardTitle>질병-수술 조합 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analysis.diseaseSurgeryMatrix
              .sort((a, b) => b.count - a.count)
              .slice(0, 20)
              .map((item, index) => (
                <div key={`${item.disease}-${item.surgery}`} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{item.disease}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm">{item.surgery}</span>
                  </div>
                  <span className="text-sm font-bold">{item.count}건</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

