'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Table, List } from 'lucide-react'
import { getDatabaseStats, checkDatabaseHealth } from '@/app/admin/maintenance/actions'

interface TableStat {
  name: string
  rowCount: number
  error?: string
}

export function DatabaseStats() {
  const [tableStats, setTableStats] = useState<TableStat[]>([])
  const [healthStatus, setHealthStatus] = useState<{ status: string; message: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [stats, health] = await Promise.all([
          getDatabaseStats(),
          checkDatabaseHealth(),
        ])
        setTableStats(stats as TableStat[])
        setHealthStatus(health as { status: string; message: string })
      } catch (error) {
        console.error('Failed to load database stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return <div className="text-center py-8">데이터베이스 통계 로딩 중...</div>
  }

  const totalRows = tableStats.reduce((sum, stat) => sum + stat.rowCount, 0)

  return (
    <div className="space-y-4">
      {/* 데이터베이스 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            데이터베이스 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthStatus && (
            <div className="flex items-center gap-2">
              <Badge
                variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}
              >
                {healthStatus.status === 'healthy' ? '정상' : '오류'}
              </Badge>
              <span className="text-sm text-muted-foreground">{healthStatus.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 테이블 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            테이블 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tableStats.map((stat) => (
              <div
                key={stat.name}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{stat.name}</span>
                  {stat.error && (
                    <Badge variant="destructive" className="text-xs">
                      오류
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold">{stat.rowCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">행</div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 border-t-2 border-primary rounded-lg bg-primary/5 mt-2">
              <div className="font-semibold">총합</div>
              <div className="text-right">
                <div className="text-2xl font-bold">{totalRows.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">행</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

