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
  // 최대값 계산하여 대칭적인 스케일 설정 (더 정확한 계산)
  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 1000
    
    // 모든 연령대의 남성/여성 최대값 찾기
    let max = 0
    for (const item of data) {
      max = Math.max(max, item.male, item.female)
    }
    
    // 가장 가까운 100의 배수로 반올림하여 깔끔한 스케일
    return Math.ceil(max / 100) * 100 * 1.1 // 10% 여유 공간
  }, [data])

  // 피라미드 형태를 위해 남성은 음수로 변환 (useMemo로 최적화)
  const pyramidData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map((item) => {
      const male = item.male || 0
      const female = item.female || 0
      const total = male + female
      
      return {
        ageGroup: item.ageGroup,
        male: -male,
        female: female,
        total: total,
        malePercentage: total > 0 ? (male / total * 100).toFixed(1) : '0.0',
        femalePercentage: total > 0 ? (female / total * 100).toFixed(1) : '0.0',
      }
    })
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
              padding: '8px 12px',
            }}
            formatter={(value: any, name: string, props: any) => {
              const absValue = Math.abs(value)
              const isMale = name === 'male'
              const percentage = isMale 
                ? (props.payload?.malePercentage || '0.0')
                : (props.payload?.femalePercentage || '0.0')
              return [
                `${absValue.toLocaleString()}명 (${percentage}%)`,
                isMale ? '남성' : '여성'
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
            strokeWidth={1.5}
            opacity={0.9}
          />
          <Bar 
            dataKey="female" 
            fill="#f472b6" 
            radius={[0, 4, 4, 0]} 
            stackId="stack"
            stroke="#ec4899"
            strokeWidth={1.5}
            opacity={0.9}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 text-xs mt-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded border" 
            style={{ 
              backgroundColor: '#2563eb',
              borderColor: '#1e40af',
              borderWidth: '1.5px'
            }} 
          />
          <span className="font-medium">남성</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded border" 
            style={{ 
              backgroundColor: '#f472b6',
              borderColor: '#ec4899',
              borderWidth: '1.5px'
            }} 
          />
          <span className="font-medium">여성</span>
        </div>
      </div>
    </div>
  )
})

