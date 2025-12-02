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
  // 피라미드 형태를 위해 남성은 음수로 변환 (useMemo로 최적화)
  const pyramidData = useMemo(() => 
    data.map((item) => ({
      ageGroup: item.ageGroup,
      male: -item.male,
      female: item.female,
    })), [data]
  )

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">연령 피라미드</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={pyramidData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            tickFormatter={(value) => Math.abs(value).toString()}
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
            formatter={(value: any, name: string) => {
              const absValue = Math.abs(value)
              return [
                `${absValue}명`,
                name === 'male' ? '남성' : '여성'
              ]
            }}
          />
          <Bar dataKey="male" fill="#2563eb" radius={[4, 0, 0, 4]} stackId="stack" />
          <Bar dataKey="female" fill="#f472b6" radius={[0, 4, 4, 0]} stackId="stack" />
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

