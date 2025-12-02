'use client'

import { memo, useMemo } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Cell
} from 'recharts'

interface AgePyramidData {
  ageGroup: string
  male: number
  female: number
}

interface AgePyramidChartProps {
  data: AgePyramidData[]
}

// 성별 색상 정의 (테마 시스템과 일관성 유지)
const MALE_COLOR = '#3b82f6' // Blue 500 - 다른 차트와 통일
const MALE_COLOR_DARK = '#2563eb' // Blue 600 - 테두리용
const FEMALE_COLOR = '#ec4899' // Pink 500 - 명확한 대비
const FEMALE_COLOR_DARK = '#db2777' // Pink 600 - 테두리용

// 관점 1-10 통합 개선사항을 반영한 최적화된 연령 피라미드 차트
export const AgePyramidChart = memo(function AgePyramidChart({ data }: AgePyramidChartProps) {
  // 관점 1: 데이터 구조 및 계산 로직 개선
  // - 더 정확한 스케일링 (대칭성 보장)
  // - 데이터 정렬 검증
  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 1000
    
    let max = 0
    for (const item of data) {
      const male = item.male || 0
      const female = item.female || 0
      max = Math.max(max, male, female)
    }
    
    // 관점 1: 더 부드러운 스케일링 (5% 여유 + 100의 배수 반올림)
    if (max === 0) return 100
    const roundedMax = Math.ceil(max / 100) * 100
    return Math.max(roundedMax * 1.05, 100) // 최소 100 보장
  }, [data])

  // 관점 2, 7: 데이터 변환 및 타입 안전성 개선
  const pyramidData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    // 관점 1: 연령대 순서 보장 (고령부터 젊은 순서)
    const ageOrder = ['70대 이상', '60대', '50대', '40대', '30대', '20대', '10대 이하']
    const sortedData = [...data].sort((a, b) => {
      const indexA = ageOrder.indexOf(a.ageGroup)
      const indexB = ageOrder.indexOf(b.ageGroup)
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
    
    return sortedData.map((item) => {
      const male = Math.max(0, item.male || 0) // 관점 9: 음수 방지
      const female = Math.max(0, item.female || 0)
      const total = male + female
      
      return {
        ageGroup: item.ageGroup,
        male: -male, // 피라미드 형태를 위한 음수 변환
        female: female,
        total: total,
        maleAbs: male,
        femaleAbs: female,
        malePercentage: total > 0 ? Number((male / total * 100).toFixed(1)) : 0,
        femalePercentage: total > 0 ? Number((female / total * 100).toFixed(1)) : 0,
      }
    })
  }, [data])

  // 관점 9: 빈 데이터 처리
  if (!data || data.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">연령 피라미드</h3>
        <div className="flex items-center justify-center h-[350px] border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">데이터가 없습니다</p>
        </div>
      </div>
    )
  }

  // 관점 6: 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0].payload
    const maleData = payload.find((p: any) => p.dataKey === 'male')
    const femaleData = payload.find((p: any) => p.dataKey === 'female')

    return (
      <div
        className="rounded-lg border bg-popover p-3 shadow-md"
        style={{
          backgroundColor: 'hsl(var(--popover))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <p className="font-semibold mb-2">{label} 연령대</p>
        <div className="space-y-1 text-sm">
          {maleData && (
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded border" 
                style={{ 
                  backgroundColor: MALE_COLOR,
                  borderColor: MALE_COLOR_DARK,
                }} 
              />
              <span>
                <strong>남성:</strong> {data.maleAbs.toLocaleString()}명 ({data.malePercentage.toFixed(1)}%)
              </span>
            </div>
          )}
          {femaleData && (
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded border" 
                style={{ 
                  backgroundColor: FEMALE_COLOR,
                  borderColor: FEMALE_COLOR_DARK,
                }} 
              />
              <span>
                <strong>여성:</strong> {data.femaleAbs.toLocaleString()}명 ({data.femalePercentage.toFixed(1)}%)
              </span>
            </div>
          )}
          <div className="pt-1 mt-1 border-t border-border">
            <span className="text-muted-foreground">
              <strong>합계:</strong> {data.total.toLocaleString()}명
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">연령 피라미드</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={pyramidData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
          barCategoryGap="10%"
          aria-label="연령별 성별 분포 피라미드 차트"
        >
          {/* 관점 8: CartesianGrid 스타일 개선 */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.5}
          />
          
          {/* 관점 8: X축 - 대칭 스케일 */}
          <XAxis
            type="number"
            domain={[-maxValue, maxValue]}
            tickFormatter={(value) => Math.abs(value).toLocaleString()}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          
          {/* 관점 8: Y축 - 연령대 레이블 */}
          <YAxis 
            dataKey="ageGroup" 
            type="category" 
            width={70}
            tick={{ 
              fontSize: 11,
              fill: 'hsl(var(--foreground))',
              textAnchor: 'end',
              dx: -10
            }}
            axisLine={false}
            tickLine={false}
          />
          
          {/* 관점 6: 커스텀 툴팁 */}
          <Tooltip content={<CustomTooltip />} />
          
          {/* 관점 8: 중앙 참조선 (0 기준) */}
          <ReferenceLine 
            x={0} 
            stroke="hsl(var(--border))" 
            strokeWidth={2}
            strokeDasharray="0"
          />
          
          {/* 남성 바 (왼쪽, 음수) - stackId 제거하여 독립적으로 표시 */}
          <Bar 
            dataKey="male" 
            fill={MALE_COLOR}
            radius={[4, 0, 0, 4]} 
            stroke={MALE_COLOR_DARK}
            strokeWidth={1.5}
            name="남성"
            aria-label="남성 연령 분포"
          >
            {pyramidData.map((entry, index) => (
              <Cell key={`male-cell-${index}`} fill={MALE_COLOR} />
            ))}
          </Bar>
          
          {/* 여성 바 (오른쪽, 양수) - stackId 제거하여 독립적으로 표시 */}
          <Bar 
            dataKey="female" 
            fill={FEMALE_COLOR}
            radius={[0, 4, 4, 0]} 
            stroke={FEMALE_COLOR_DARK}
            strokeWidth={1.5}
            name="여성"
            aria-label="여성 연령 분포"
          >
            {pyramidData.map((entry, index) => (
              <Cell key={`female-cell-${index}`} fill={FEMALE_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* 관점 5, 6: 레전드 개선 (반응형 및 접근성) */}
      <div 
        className="flex items-center justify-center gap-6 text-xs mt-3"
        role="list"
        aria-label="성별 범례"
      >
        <div 
          className="flex items-center gap-2"
          role="listitem"
        >
          <div 
            className="w-4 h-4 rounded border flex-shrink-0" 
            style={{ 
              backgroundColor: MALE_COLOR,
              borderColor: MALE_COLOR_DARK,
              borderWidth: '1.5px'
            }} 
            aria-hidden="true"
          />
          <span className="font-medium">남성</span>
        </div>
        <div 
          className="flex items-center gap-2"
          role="listitem"
        >
          <div 
            className="w-4 h-4 rounded border flex-shrink-0" 
            style={{ 
              backgroundColor: FEMALE_COLOR,
              borderColor: FEMALE_COLOR_DARK,
              borderWidth: '1.5px'
            }} 
            aria-hidden="true"
          />
          <span className="font-medium">여성</span>
        </div>
      </div>
    </div>
  )
})
