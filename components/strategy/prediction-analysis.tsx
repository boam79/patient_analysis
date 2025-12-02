'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PatientData } from '@/stores/data-store'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { extractMonth, parseDate } from '@/lib/utils/date-helpers'

interface PredictionAnalysisProps {
  data: PatientData[]
}

export function PredictionAnalysis({ data }: PredictionAnalysisProps) {
  const predictions = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        monthlyForecast: [],
        diseaseForecast: [],
        regionalForecast: [],
      }
    }

    // 과거 월별 데이터
    const monthlyData = new Map<string, number>()
    data.forEach(p => {
      const month = extractMonth(p.visit_date)
      if (month) {
        monthlyData.set(month, (monthlyData.get(month) || 0) + 1)
      }
    })

    const sortedMonths = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6) // 최근 6개월

    // 단순 이동평균 기반 예측
    interface ForecastData {
      month: string
      actual: number | null
      forecast: number | null
    }
    
    const monthlyForecast: ForecastData[] = [...sortedMonths.map(([month, visits]) => ({
      month,
      actual: visits,
      forecast: null,
    }))]

    // 다음 3개월 예측
    if (sortedMonths.length >= 3) {
      const last3Months = sortedMonths.slice(-3).map(([_, visits]) => visits)
      const avg = last3Months.reduce((sum, v) => sum + v, 0) / 3
      const trend = (last3Months[2] - last3Months[0]) / 2

      for (let i = 1; i <= 3; i++) {
        const lastMonth = sortedMonths[sortedMonths.length - 1][0]
        const date = parseDate(lastMonth + '-01')
        if (date) {
          date.setMonth(date.getMonth() + i)
          const forecastMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          
          monthlyForecast.push({
            month: forecastMonth,
            actual: null,
            forecast: Math.max(0, Math.round(avg + trend * i)),
          })
        }
      }
    }

    // 질병별 예측
    const diseaseMonthly = new Map<string, Map<string, number>>()
    data.forEach(p => {
      const month = extractMonth(p.visit_date)
      if (month) {
        if (!diseaseMonthly.has(p.disease_name)) {
          diseaseMonthly.set(p.disease_name, new Map())
        }
        const monthData = diseaseMonthly.get(p.disease_name)!
        monthData.set(month, (monthData.get(month) || 0) + 1)
      }
    })

    const diseaseForecast = Array.from(diseaseMonthly.entries())
      .map(([disease, monthData]) => {
        const sorted = Array.from(monthData.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-3)
        
        if (sorted.length >= 3) {
          const values = sorted.map(([_, count]) => count)
          const avg = values.reduce((sum, v) => sum + v, 0) / 3
          const trend = (values[2] - values[0]) / 2
          
          return {
            disease,
            current: values[2],
            forecast: Math.max(0, Math.round(avg + trend)),
            trend: trend > 0 ? '증가' : trend < 0 ? '감소' : '유지',
          }
        }
        return null
      })
      .filter(item => item !== null)
      .sort((a, b) => (b?.current || 0) - (a?.current || 0))
      .slice(0, 10)

    // 지역별 예측
    const regionalMonthly = new Map<string, Map<string, number>>()
    data.forEach(p => {
      if (!p.region) return
      const month = extractMonth(p.visit_date)
      if (month) {
        if (!regionalMonthly.has(p.region)) {
          regionalMonthly.set(p.region, new Map())
        }
        const monthData = regionalMonthly.get(p.region)!
        monthData.set(month, (monthData.get(month) || 0) + 1)
      }
    })

    const regionalForecast = Array.from(regionalMonthly.entries())
      .map(([region, monthData]) => {
        const sorted = Array.from(monthData.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-3)
        
        if (sorted.length >= 3) {
          const values = sorted.map(([_, count]) => count)
          const avg = values.reduce((sum, v) => sum + v, 0) / 3
          const trend = (values[2] - values[0]) / 2
          
          return {
            region,
            current: values[2],
            forecast: Math.max(0, Math.round(avg + trend)),
            trend: trend > 0 ? '증가' : trend < 0 ? '감소' : '유지',
          }
        }
        return null
      })
      .filter(item => item !== null)
      .sort((a, b) => (b?.current || 0) - (a?.current || 0))
      .slice(0, 10)

    return {
      monthlyForecast,
      diseaseForecast: diseaseForecast as Array<{
        disease: string
        current: number
        forecast: number
        trend: string
      }>,
      regionalForecast: regionalForecast as Array<{
        region: string
        current: number
        forecast: number
        trend: string
      }>,
    }
  }, [data])

  return (
    <div className="space-y-6">
      {/* 월별 예측 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 환자 수 예측</CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.monthlyForecast.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictions.monthlyForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: any) => {
                  if (value === null || value === undefined) return 'N/A'
                  const num = Number(value)
                  return isNaN(num) ? 'N/A' : num.toLocaleString()
                }} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#8884d8" 
                  name="실제" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#82ca9d" 
                  name="예측" 
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              예측은 최근 3개월 데이터를 기반으로 한 단순 이동평균 및 트렌드 분석입니다.
              실제 예측 정확도는 더 많은 데이터와 고급 모델이 필요합니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 질병별 예측 */}
      <Card>
        <CardHeader>
          <CardTitle>질병별 환자 수 예측 Top 10</CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.diseaseForecast.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {predictions.diseaseForecast.map((item, index) => (
              <div key={item.disease} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{item.disease}</p>
                    <p className="text-xs text-muted-foreground">
                      현재: {item.current}명
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold">{item.forecast}명</p>
                    <p className="text-xs text-muted-foreground">예측</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    item.trend === '증가' ? 'bg-green-100 text-green-700' :
                    item.trend === '감소' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.trend}
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 지역별 예측 */}
      <Card>
        <CardHeader>
          <CardTitle>지역별 환자 수 예측 Top 10</CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.regionalForecast.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {predictions.regionalForecast.map((item, index) => (
              <div key={item.region} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{item.region}</p>
                    <p className="text-xs text-muted-foreground">
                      현재: {item.current}명
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold">{item.forecast}명</p>
                    <p className="text-xs text-muted-foreground">예측</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    item.trend === '증가' ? 'bg-green-100 text-green-700' :
                    item.trend === '감소' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.trend}
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

