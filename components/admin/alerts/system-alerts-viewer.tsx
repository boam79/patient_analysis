'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface SystemAlert {
  id: number
  alert_key: string
  severity: string
  message: string
  sent_at: string
}

interface Props {
  alerts: SystemAlert[]
  page: number
  totalPages: number
  severity: string
}

export function SystemAlertsViewer({ alerts, severity }: Props) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <select
        value={severity}
        onChange={(e) =>
          router.push(`/admin/alerts?page=1&severity=${e.target.value}`)
        }
        className="rounded-md border px-3 py-2 text-sm"
      >
        <option value="all">전체 심각도</option>
        <option value="high">high</option>
        <option value="medium">medium</option>
        <option value="low">low</option>
      </select>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시각</TableHead>
              <TableHead>심각도</TableHead>
              <TableHead>키</TableHead>
              <TableHead>메시지</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  알림이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {format(new Date(alert.sent_at), 'yyyy-MM-dd HH:mm', {
                      locale: ko,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        alert.severity === 'high' ? 'destructive' : 'secondary'
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {alert.alert_key}
                  </TableCell>
                  <TableCell className="max-w-md truncate text-sm">
                    {alert.message}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
