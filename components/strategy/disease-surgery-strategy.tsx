'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { TrendingUp, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts'

interface DiseaseSurgeryStrategyProps {
  data: PatientData[]
}

export function DiseaseSurgeryStrategy({ data }: DiseaseSurgeryStrategyProps) {
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
      diseaseStat.uniquePatients.add(p.patient_id)
      if (p.surgery_name) {
        diseaseStat.withSurgery++
      }
      diseaseStat.ageSum += p.age
      diseaseStat.ageCount++

      // 수술별 통계
      if (p.surgery_name) {
        if (!surgeryStats.has(p.surgery_name)) {
          surgeryStats.set(p.surgery_name, {
            count: 0,
            uniquePatients: new Set(),
            diseases: new Set(),
          })
        }
        const surgeryStat = surgeryStats.get(p.surgery_name)!
        surgeryStat.count++
        surgeryStat.uniquePatients.add(p.patient_id)
        surgeryStat.diseases.add(p.disease_name)

        // 질병-수술 매트릭스
        if (!diseaseSurgeryMatrix.has(p.disease_name)) {
          diseaseSurgeryMatrix.set(p.disease_name, new Map())
        }
        const matrix = diseaseSurgeryMatrix.get(p.disease_name)!
        matrix.set(p.surgery_name, (matrix.get(p.surgery_name) || 0) + 1)
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
      patientVisitCounts.set(p.patient_id, (patientVisitCounts.get(p.patient_id) || 0) + 1)
      
      if (!patientDiseases.has(p.patient_id)) {
        patientDiseases.set(p.patient_id, new Set())
      }
      patientDiseases.get(p.patient_id)!.add(p.disease_name)
      
      if (p.surgery_name) {
        if (!patientSurgeries.has(p.patient_id)) {
          patientSurgeries.set(p.patient_id, new Set())
        }
        patientSurgeries.get(p.patient_id)!.add(p.surgery_name)
      }
    })

    // 질병별 재방문율
    const diseaseRetention = new Map<string, { total: number; returning: number }>()
    patientVisitCounts.forEach((count, patientId) => {
      const diseases = patientDiseases.get(patientId) || new Set()
      diseases.forEach(disease => {
        if (!diseaseRetention.has(disease)) {
          diseaseRetention.set(disease, { total: 0, returning: 0 })
        }
        const stat = diseaseRetention.get(disease)!
        stat.total++
        if (count > 1) {
          stat.returning++
        }
      })
    })

    const diseaseRetentionArray = Array.from(diseaseRetention.entries())
      .map(([disease, stat]) => ({
        disease,
        retentionRate: stat.total > 0 ? (stat.returning / stat.total) * 100 : 0,
        total: stat.total,
        returning: stat.returning,
      }))
      .sort((a, b) => b.total - a.total)

    // 수술별 재방문율
    const surgeryRetention = new Map<string, { total: number; returning: number }>()
    patientVisitCounts.forEach((count, patientId) => {
      const surgeries = patientSurgeries.get(patientId) || new Set()
      surgeries.forEach(surgery => {
        if (!surgeryRetention.has(surgery)) {
          surgeryRetention.set(surgery, { total: 0, returning: 0 })
        }
        const stat = surgeryRetention.get(surgery)!
        stat.total++
        if (count > 1) {
          stat.returning++
        }
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
  }, [data])

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
          <CardTitle>질병별 재방문율 Top 10</CardTitle>
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

