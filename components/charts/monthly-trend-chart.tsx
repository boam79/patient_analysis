'use client'

import { memo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts'

interface MonthlyTrendData {
  month: string
  recurrenceRate: number
  lifetimeReturnShare?: number
  newPatients: number
  returningPatients: number
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[]
}

/** 월별 생애 신규/재방문 — KPI 윈도우 재방문율과 다른 정의 */
export const MonthlyTrendChart = memo(function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">월별 생애재방문 비중</h3>
      <p className="text-xs text-muted-foreground">
        해당 월 방문자 중 생애 첫 방문이 아닌 환자 비율 (윈도우 미적용)
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis
            yAxisId="left"
            label={{ value: '생애재방문 (%)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: '환자수', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="recurrenceRate"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="생애재방문 비중 (%)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="newPatients"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="신규(생애 첫월)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="returningPatients"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="생애재방문"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

export const NewVsReturningChart = memo(function NewVsReturningChart({ data }: MonthlyTrendChartProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">신규 vs 생애재방문</h3>
      <p className="text-xs text-muted-foreground">월별 생애 기준 (윈도우 미적용)</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="newPatients"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            name="신규(생애 첫월)"
          />
          <Area
            type="monotone"
            dataKey="returningPatients"
            stackId="1"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.6}
            name="생애재방문"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})
