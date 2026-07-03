'use client'

import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VirtualizedTableProps {
  data: any[]
  columns: { key: string; label: string; width?: number }[]
  height?: number
  rowHeight?: number
}

/**
 * 가상화된 테이블 컴포넌트
 * 대용량 데이터를 효율적으로 렌더링
 */
export function VirtualizedTable({
  data,
  columns,
  height = 400,
  rowHeight = 40,
}: VirtualizedTableProps) {
  // 테이블 헤더 렌더링
  const headerRow = useMemo(() => (
    <div
      className="flex border-b bg-muted/50 font-medium sticky top-0 z-10"
      style={{ height: rowHeight }}
    >
      {columns.map((column, index) => (
        <div
          key={column.key}
          className="flex items-center px-4"
          style={{
            width: column.width || `${100 / columns.length}%`,
            borderRight: index < columns.length - 1 ? '1px solid hsl(var(--border))' : 'none',
          }}
        >
          {column.label}
        </div>
      ))}
    </div>
  ), [columns, rowHeight])

  // 행 렌더링 함수
  const Row = useMemo(() => {
    return function TableRow({ index, style }: { index: number; style: React.CSSProperties }) {
      const row = data[index]
      
      return (
        <div
          className="flex border-b hover:bg-muted/50 transition-colors"
          style={style}
        >
          {columns.map((column, colIndex) => (
            <div
              key={column.key}
              className="flex items-center px-4 truncate"
              style={{
                width: column.width || `${100 / columns.length}%`,
                borderRight: colIndex < columns.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              }}
              title={row[column.key]?.toString()}
            >
              {row[column.key]?.toString() || '-'}
            </div>
          ))}
        </div>
      )
    }
  }, [data, columns])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>데이터 테이블</CardTitle>
        <p className="text-sm text-muted-foreground">
          총 {data.length.toLocaleString()}개 레코드
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {headerRow}
        <List
          height={height}
          itemCount={data.length}
          itemSize={rowHeight}
          width="100%"
        >
          {Row}
        </List>
      </CardContent>
    </Card>
  )
}

