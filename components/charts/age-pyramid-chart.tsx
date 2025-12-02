'use client'

import { memo, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

interface AgePyramidData {
  ageGroup: string
  male: number
  female: number
}

interface AgePyramidChartProps {
  data: AgePyramidData[]
}

export const AgePyramidChart = memo(function AgePyramidChart({ data }: AgePyramidChartProps) {
  // 최대값 계산하여 대칭적인 스케일 설정
  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 1000
    return Math.max(
      ...data.map(item => Math.max(item.male, item.female))
    ) * 1.1 // 10% 여유 공간
  }, [data])

  // 피라미드 형태를 위해 남성은 음수로 변환 (useMemo로 최적화)
  const pyramidData = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((item) => ({
      ageGroup: item.ageGroup,
      male: -item.male,
      female: item.female,
      total: item.male + item.female,
    }))
  }, [data])

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">연령 피라미드</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={pyramidData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            domain={[-maxValue, maxValue]}
            tickFormatter={(value) => Math.abs(value).toString()}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            dataKey="ageGroup" 
            type="category" 
            width={60}
            fontSize={10}
            tick={{ 
              textAnchor: 'start',
              dx: -55
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any, name: string, props: any) => {
              const absValue = Math.abs(value)
              const total = props.payload?.total || 0
              const percentage = total > 0 ? ((absValue / total) * 100).toFixed(1) : '0.0'
              return [
                `${absValue}명 (${percentage}%)`,
                name === 'male' ? '남성' : '여성'
              ]
            }}
            labelFormatter={(label) => `${label} 연령대`}
          />
          <Bar 
            dataKey="male" 
            fill="#2563eb" 
            radius={[4, 0, 0, 4]} 
            stackId="stack"
            stroke="#1e40af"
            strokeWidth={1}
          />
          <Bar 
            dataKey="female" 
            fill="#f472b6" 
            radius={[0, 4, 4, 0]} 
            stackId="stack"
            stroke="#ec4899"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#2563eb' }} />
          <span>남성</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f472b6' }} />
          <span>여성</span>
        </div>
      </div>
    </div>
  )
})

