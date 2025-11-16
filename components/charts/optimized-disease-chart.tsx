'use client'

import React, { useMemo, useCallback, memo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFilterStore } from '@/stores/filter-store'

interface DiseaseData {
  name: string
  count: number
  percentage: number
}

interface OptimizedDiseaseChartProps {
  data: DiseaseData[]
  title: string
}

// Tooltip 컴포넌트 메모이제이션
const CustomTooltip = memo(({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload
  return (
    <Card className="p-2 text-sm shadow-lg">
      <p className="font-bold">{data.name}</p>
      <p className="text-muted-foreground">환자수: {data.count}명</p>
      <p className="text-muted-foreground">비율: {data.percentage.toFixed(1)}%</p>
    </Card>
  )
})

CustomTooltip.displayName = 'CustomTooltip'

// 차트 컴포넌트 자체를 메모이제이션
export const OptimizedDiseaseChart = memo(({ data, title }: OptimizedDiseaseChartProps) => {
  const { selectedDiseases, addDisease, removeDisease } = useFilterStore()

  // 선택 상태 체크 로직을 useMemo로 최적화
  const enrichedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      isSelected: selectedDiseases.includes(item.name),
    }))
  }, [data, selectedDiseases])

  // 클릭 핸들러를 useCallback으로 최적화
  const handleBarClick = useCallback((name: string) => {
    if (selectedDiseases.includes(name)) {
      removeDisease(name)
    } else {
      addDisease(name)
    }
  }, [selectedDiseases, addDisease, removeDisease])

  // 색상 결정 로직을 useMemo로 최적화
  const getBarColor = useCallback((isSelected: boolean) => {
    return isSelected ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(215 27.9% 16.9%)'
  }, [])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {selectedDiseases.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {selectedDiseases.length}개 선택됨
          </p>
        )}
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={enrichedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              name="환자수"
              cursor="pointer"
              onClick={(data: any) => data?.name && handleBarClick(data.name)}
            >
              {enrichedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.isSelected)}
                  opacity={entry.isSelected ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

OptimizedDiseaseChart.displayName = 'OptimizedDiseaseChart'

