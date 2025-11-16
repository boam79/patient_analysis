'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// ColorBrewer Qualitative Set3 (질병 카테고리별 색상)
const DISEASE_COLORS = [
  '#8DD3C7', // 근골격계
  '#FB8072', // 순환계
  '#80B1D3', // 호흡기
  '#FDB462', // 소화기
  '#B3DE69', // 신경계
  '#FCCDE5', // 내분비
  '#BEBADA', // 기타1
  '#FFFFB3', // 기타2
  '#BC80BD', // 기타3
  '#CCEBC5', // 기타4
]

interface DiseaseData {
  name: string
  count: number
  percentage: number
}

interface TopDiseasesChartProps {
  data: DiseaseData[]
  title?: string
}

export function TopDiseasesChart({ data, title = 'Top 10 질병' }: TopDiseasesChartProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={90} fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any, name: string) => {
              const item = data.find((d) => d.count === value)
              return [`${value}명 (${item?.percentage.toFixed(1)}%)`, '환자수']
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={DISEASE_COLORS[index % DISEASE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

