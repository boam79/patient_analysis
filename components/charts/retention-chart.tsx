'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

interface RetentionPoint {
  bucket: string
  count: number
  percentage: number
}

interface RetentionChartProps {
  data: RetentionPoint[]
}

export function RetentionChart({ data }: RetentionChartProps) {
  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="bucket" fontSize={12} />
          <YAxis
            yAxisId="left"
            label={{ value: '환자 수', angle: -90, position: 'insideLeft', fontSize: 12 }}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            label={{ value: '비율 (%)', angle: 90, position: 'insideRight', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: any, name) =>
              name === '재방문 비율' ? [`${value}%`, name] : [value.toLocaleString(), name]
            }
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="count"
            name="두 번째 방문 환자수"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="percentage"
            name="재방문 비율"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

