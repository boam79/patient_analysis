'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
  Cell,
} from 'recharts'

interface SurgeryScatterData {
  surgeryName: string
  avgAge: number
  recurrenceRate: number
  patientCount: number
}

interface SurgeryScatterChartProps {
  data: SurgeryScatterData[]
}

const SCATTER_COLORS = [
  '#3b82f6', // 파란색
  '#10B981', // 초록색
  '#f59e0b', // 주황색
  '#ef4444', // 빨간색
  '#8b5cf6', // 보라색
  '#ec4899', // 핑크색
  '#14b8a6', // 청록색
  '#f97316', // 진한 주황색
]

export function SurgeryScatterChart({ data }: SurgeryScatterChartProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">수술별 연령-재방문율 산점도</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="avgAge"
            name="평균 연령"
            label={{ value: '평균 연령 (세)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            type="number"
            dataKey="recurrenceRate"
            name="재방문율"
            label={{ value: '재방문율 (%)', angle: -90, position: 'insideLeft' }}
          />
          <ZAxis type="number" dataKey="patientCount" range={[50, 400]} name="환자수" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value: any, name: string) => {
              if (name === '평균 연령') return [`${value}세`, '평균 연령']
              if (name === '재방문율') return [`${value}%`, '재방문율']
              if (name === '환자수') return [`${value}명`, '환자수']
              return [value, name]
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={50}
            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
          />
          <Scatter name="수술" data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={SCATTER_COLORS[index % SCATTER_COLORS.length]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

// 수술-질병 히트맵 데이터
interface SurgeryDiseaseMatrixData {
  surgery: string
  [key: string]: string | number // 질병명: 환자수
}

interface SurgeryDiseaseMatrixProps {
  data: SurgeryDiseaseMatrixData[]
  diseases: string[]
}

export function SurgeryDiseaseMatrix({ data, diseases }: SurgeryDiseaseMatrixProps) {
  // 히트맵을 위한 최대값 계산
  const maxValue = Math.max(
    ...data.flatMap((row) => diseases.map((disease) => (row[disease] as number) || 0))
  )

  const getColor = (value: number) => {
    if (!value || value === 0) return 'hsl(var(--muted))'
    const intensity = value / maxValue
    const hue = 200 // 파란색 계열
    const lightness = 100 - intensity * 50 // 밝기 조절
    return `hsl(${hue}, 70%, ${lightness}%)`
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">수술-질병 연관 매트릭스</h3>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-2 text-left font-medium sticky left-0 bg-background">수술</th>
              {diseases.map((disease) => (
                <th key={disease} className="px-2 py-2 text-center font-medium min-w-[80px]">
                  {disease}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                <td className="px-2 py-2 font-medium sticky left-0 bg-background">
                  {row.surgery}
                </td>
                {diseases.map((disease) => {
                  const value = (row[disease] as number) || 0
                  return (
                    <td
                      key={disease}
                      className="px-2 py-2 text-center"
                      style={{
                        backgroundColor: getColor(value),
                      }}
                    >
                      {value > 0 ? value : '-'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-xs justify-end">
        <span>낮음</span>
        <div className="flex">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, idx) => (
            <div
              key={idx}
              className="w-6 h-4"
              style={{
                backgroundColor: `hsl(200, 70%, ${100 - intensity * 50}%)`,
              }}
            />
          ))}
        </div>
        <span>높음</span>
      </div>
    </div>
  )
}

