'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { Users, Target } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { getAgeGroup, normalizeGender } from '@/lib/utils/patient-helpers'

interface CustomerSegmentAnalysisProps {
  data: PatientData[]
}

export function CustomerSegmentAnalysis({ data }: CustomerSegmentAnalysisProps) {
  const analysis = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        ageSegments: [],
        genderSegments: [],
        ageGenderSegments: [],
        highValueSegments: [],
      }
    }

    // 환자별 방문 횟수
    const patientVisitCounts = new Map<string, number>()
    const patientAge = new Map<string, number>()
    const patientGender = new Map<string, string>()

    data.forEach(p => {
      patientVisitCounts.set(p.patient_id, (patientVisitCounts.get(p.patient_id) || 0) + 1)
      patientAge.set(p.patient_id, p.age)
      patientGender.set(p.patient_id, p.gender)
    })

    // 연령대별 세그먼트
    const ageSegments = new Map<string, { total: number; unique: Set<string> }>()
    patientAge.forEach((age, patientId) => {
      const ageGroup = getAgeGroup(age)
      if (!ageSegments.has(ageGroup)) {
        ageSegments.set(ageGroup, { total: 0, unique: new Set() })
      }
      const segment = ageSegments.get(ageGroup)!
      segment.total += patientVisitCounts.get(patientId) || 0
      segment.unique.add(patientId)
    })

    const ageSegmentsArray = Array.from(ageSegments.entries())
      .map(([ageGroup, stat]) => ({
        ageGroup,
        totalVisits: stat.total,
        uniquePatients: stat.unique.size,
        avgVisits: stat.unique.size > 0 ? stat.total / stat.unique.size : 0,
      }))
      .sort((a, b) => {
        const order = ['10대 이하', '20대', '30대', '40대', '50대', '60대', '70대 이상']
        return order.indexOf(a.ageGroup) - order.indexOf(b.ageGroup)
      })

    // 성별 세그먼트
    const genderSegments = new Map<string, { total: number; unique: Set<string> }>()
    patientGender.forEach((gender, patientId) => {
      const genderKey = normalizeGender(gender)
      if (genderKey !== '미상') {
        if (!genderSegments.has(genderKey)) {
          genderSegments.set(genderKey, { total: 0, unique: new Set() })
        }
        const segment = genderSegments.get(genderKey)!
        segment.total += patientVisitCounts.get(patientId) || 0
        segment.unique.add(patientId)
      }
    })

    const genderSegmentsArray = Array.from(genderSegments.entries())
      .map(([gender, stat]) => ({
        gender,
        totalVisits: stat.total,
        uniquePatients: stat.unique.size,
        avgVisits: stat.unique.size > 0 ? stat.total / stat.unique.size : 0,
      }))

    // 연령대+성별 복합 세그먼트
    const ageGenderSegments = new Map<string, { total: number; unique: Set<string> }>()
    patientAge.forEach((age, patientId) => {
      const ageGroup = getAgeGroup(age)
      const gender = normalizeGender(patientGender.get(patientId))
      if (gender !== '미상') {
        const segmentKey = `${ageGroup}-${gender}`
        
        if (!ageGenderSegments.has(segmentKey)) {
          ageGenderSegments.set(segmentKey, { total: 0, unique: new Set() })
        }
        const segment = ageGenderSegments.get(segmentKey)!
        segment.total += patientVisitCounts.get(patientId) || 0
        segment.unique.add(patientId)
      }
    })

    const ageGenderSegmentsArray = Array.from(ageGenderSegments.entries())
      .map(([segment, stat]) => {
        const [ageGroup, gender] = segment.split('-')
        return {
          segment,
          ageGroup,
          gender,
          totalVisits: stat.total,
          uniquePatients: stat.unique.size,
          avgVisits: stat.unique.size > 0 ? stat.total / stat.unique.size : 0,
        }
      })
      .sort((a, b) => b.totalVisits - a.totalVisits)

    // 고가치 세그먼트 (5회 이상 방문)
    const highValuePatients = Array.from(patientVisitCounts.entries())
      .filter(([_, count]) => count >= 5)
      .map(([patientId, _]) => patientId)

    const highValueSegments = new Map<string, number>()
    highValuePatients.forEach(patientId => {
      const age = patientAge.get(patientId) || 0
      const gender = normalizeGender(patientGender.get(patientId))
      if (gender !== '미상') {
        const ageGroup = getAgeGroup(age)
        const segmentKey = `${ageGroup}-${gender}`
        
        highValueSegments.set(segmentKey, (highValueSegments.get(segmentKey) || 0) + 1)
      }
    })

    const highValueSegmentsArray = Array.from(highValueSegments.entries())
      .map(([segment, count]) => {
        const [ageGroup, gender] = segment.split('-')
        return { segment, ageGroup, gender, count }
      })
      .sort((a, b) => b.count - a.count)

    return {
      ageSegments: ageSegmentsArray,
      genderSegments: genderSegmentsArray,
      ageGenderSegments: ageGenderSegmentsArray,
      highValueSegments: highValueSegmentsArray,
    }
  }, [data])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  return (
    <div className="space-y-6">
      {/* 연령대별 세그먼트 */}
      <Card>
        <CardHeader>
          <CardTitle>연령대별 세그먼트 분석</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.ageSegments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analysis.ageSegments}
                    dataKey="uniquePatients"
                    nameKey="ageGroup"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {analysis.ageSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            <div className="space-y-2">
              {analysis.ageSegments.map((segment) => (
                <div key={segment.ageGroup} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{segment.ageGroup}</p>
                    <p className="text-xs text-muted-foreground">
                      {segment.uniquePatients}명 | 평균 {segment.avgVisits.toFixed(1)}회
                    </p>
                  </div>
                  <span className="text-lg font-bold">{segment.totalVisits}</span>
                </div>
              ))}
            </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 성별 세그먼트 */}
      <Card>
        <CardHeader>
          <CardTitle>성별 세그먼트 분석</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.genderSegments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.genderSegments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gender" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="uniquePatients" fill="#8884d8" name="고유 환자 수" />
                <Bar dataKey="totalVisits" fill="#82ca9d" name="총 방문 수" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 연령대+성별 복합 세그먼트 */}
      <Card>
        <CardHeader>
          <CardTitle>연령대+성별 복합 세그먼트 Top 10</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.ageGenderSegments.slice(0, 10).map((segment, index) => (
              <div key={segment.segment} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{segment.ageGroup} {segment.gender}</p>
                    <p className="text-xs text-muted-foreground">
                      {segment.uniquePatients}명 | 평균 {segment.avgVisits.toFixed(1)}회
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold">{segment.totalVisits}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 고가치 세그먼트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            고가치 고객 세그먼트 (5회 이상 방문)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.highValueSegments.map((segment, index) => (
              <div key={segment.segment} className="flex items-center justify-between p-3 border rounded bg-primary/5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{segment.ageGroup} {segment.gender}</p>
                    <p className="text-xs text-muted-foreground">
                      장기 고객 세그먼트
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary">{segment.count}명</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


