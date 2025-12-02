'use client'

import { memo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useFilterStore } from '@/stores/filter-store'

const DISEASE_COLORS = [
  '#8DD3C7', '#FB8072', '#80B1D3', '#FDB462', '#B3DE69',
  '#FCCDE5', '#BEBADA', '#FFFFB3', '#BC80BD', '#CCEBC5',
]

interface DiseaseData {
  name: string
  count: number
  percentage: number
}

interface InteractiveDiseaseChartProps {
  data: DiseaseData[]
  title?: string
}

export const InteractiveDiseaseChart = memo(function InteractiveDiseaseChart({ data, title = 'Top 10 질병' }: InteractiveDiseaseChartProps) {
  const { selectedDiseases, addDisease, removeDisease, setSelectedChartData } = useFilterStore()

  const handleBarClick = (entry: DiseaseData) => {
    // 차트 데이터 선택 상태 업데이트
    setSelectedChartData('disease', entry.name)
    
    // 필터에 추가/제거
    if (selectedDiseases.includes(entry.name)) {
      removeDisease(entry.name)
    } else {
      addDisease(entry.name)
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={90} 
            fontSize={10}
            tick={{ 
              textAnchor: 'start',
              dx: -85
            }}
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any) => {
              const item = data.find((d) => d.count === value)
              const percentageText = item ? `${item.percentage.toFixed(1)}%` : ''
              return [`${value}명${percentageText ? ` (${percentageText})` : ''}`, '환자수']
            }}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            onClick={(entry) => handleBarClick(entry.payload as DiseaseData)}
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  selectedDiseases.includes(entry.name)
                    ? '#10B981' // 선택된 항목은 초록색
                    : DISEASE_COLORS[index % DISEASE_COLORS.length]
                }
                opacity={selectedDiseases.length > 0 && !selectedDiseases.includes(entry.name) ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {selectedDiseases.length > 0 && (
        <p className="text-xs text-muted-foreground">
          💡 클릭하여 필터 추가/제거 (현재 {selectedDiseases.length}개 선택)
        </p>
      )}
    </div>
  )
})

