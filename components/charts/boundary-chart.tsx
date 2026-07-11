'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from 'recharts'
import { useFilterStore } from '@/stores/filter-store'

interface BoundaryData {
  region: string
  patients: number
  recurrenceRate: number
  avgAge: number
}

interface BoundaryChartProps {
  data: BoundaryData[]
}

export function BoundaryComparisonChart({ data }: BoundaryChartProps) {
  const { selectedRegions, addRegion, removeRegion } = useFilterStore()

  const handleBarClick = (entry: BoundaryData) => {
    if (!entry?.region) return
    if (selectedRegions.includes(entry.region)) {
      removeRegion(entry.region)
    } else {
      addRegion(entry.region)
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">시/군/구 비교</h3>
      <p className="text-xs text-muted-foreground">
        막대 클릭 시 지역 필터와 지도 선택이 연동됩니다
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="region" fontSize={12} angle={-45} textAnchor="end" height={80} />
          <YAxis yAxisId="left" label={{ value: '환자수', angle: -90, position: 'insideLeft' }} />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: '재방문율 (%)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="patients"
            fill="hsl(var(--primary))"
            name="환자수"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={(data: any) => {
              const row = (data?.payload ?? data) as BoundaryData | undefined
              if (row?.region) handleBarClick(row)
            }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="recurrenceRate"
            stroke="hsl(var(--chart-5))"
            strokeWidth={2}
            name="재방문율 (%)"
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// Boxplot 데이터 인터페이스
interface BoxplotData {
  region: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
}

interface BoxplotChartProps {
  data: BoxplotData[]
}

export function BoxplotChart({ data }: BoxplotChartProps) {
  // Recharts는 기본 Boxplot이 없으므로 커스텀 렌더링
  // 여기서는 간단한 시각화를 위해 ComposedChart 사용
  
  // 데이터를 여러 시리즈로 변환
  const chartData = data.map((item) => ({
    region: item.region,
    range: [item.min, item.max],
    q1: item.q1,
    median: item.median,
    q3: item.q3,
  }))

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">재방문 간격 사분위 (막대 근사)</h3>
      <p className="text-xs text-muted-foreground">
        통계적 박스플롯이 아니라 Q1·중앙값·Q3 구간을 막대로 표현합니다
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="region" fontSize={12} />
          <YAxis label={{ value: '재방문 간격 (일)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any, name: string) => {
              if (name === 'median') return [`중앙값: ${value}일`, '']
              if (name === 'q1') return [`Q1: ${value}일`, '']
              if (name === 'q3') return [`Q3: ${value}일`, '']
              if (name === 'min') return [`최소: ${value}일`, '']
              if (name === 'max') return [`최대: ${value}일`, '']
              return [value, name]
            }}
          />
          <Bar dataKey="min" stackId="a" fill="transparent" />
          <Bar dataKey="q1" stackId="a" fill="#3b82f6" fillOpacity={0.3} />
          <Bar dataKey="median" stackId="a" fill="#3b82f6" fillOpacity={0.6} />
          <Bar dataKey="q3" stackId="a" fill="#3b82f6" fillOpacity={0.3} />
          <Bar dataKey="max" stackId="a" fill="transparent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

