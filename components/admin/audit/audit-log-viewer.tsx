'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Search, Download, Calendar, Eye, User } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { exportAuditLogs } from '@/app/admin/audit/actions'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user_profiles?: {
    email: string
    name: string | null
  } | null
}

interface AuditLogViewerProps {
  logs: AuditLog[]
}

const ACTION_COLORS: Record<string, string> = {
  'user.approve': 'bg-green-100 text-green-800',
  'user.reject': 'bg-orange-100 text-orange-800',
  'user.create': 'bg-blue-100 text-blue-800',
  'user.delete': 'bg-red-100 text-red-800',
  'user.role.update': 'bg-purple-100 text-purple-800',
}

export function AuditLogViewer({ logs: initialLogs }: AuditLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isPending, startTransition] = useTransition()

  // 액션 목록 추출
  const actions = Array.from(new Set(initialLogs.map(log => log.action))).sort()

  // 필터링
  const filteredLogs = initialLogs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.resource && log.resource.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.ip_address && log.ip_address.includes(searchTerm)) ||
      (log.user_profiles?.email && log.user_profiles.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesAction = selectedAction === 'all' || log.action === selectedAction
    const matchesStartDate = !startDate || new Date(log.created_at) >= new Date(startDate)
    const matchesEndDate = !endDate || new Date(log.created_at) <= new Date(endDate)
    
    return matchesSearch && matchesAction && matchesStartDate && matchesEndDate
  })

  const handleExport = async () => {
    startTransition(async () => {
      try {
        const data = await exportAuditLogs(
          startDate || undefined,
          endDate || undefined,
          selectedAction !== 'all' ? selectedAction : undefined
        )

        // CSV 변환
        const headers = ['시간', '액션', '리소스', '사용자', 'IP 주소', 'User-Agent', '상세']
        const csvRows = [
          headers.join(','),
          ...data.map((log: any) => [
            format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko }),
            log.action,
            log.resource || '',
            log.user_profiles?.email || '',
            log.ip_address || '',
            `"${(log.user_agent || '').replace(/"/g, '""')}"`,
            `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
          ].join(','))
        ]

        const csvContent = csvRows.join('\n')
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast.success('감사 로그가 내보내기되었습니다.')
      } catch (error: any) {
        toast.error(error.message || '내보내기 중 오류가 발생했습니다.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* 필터 바 */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="액션, 리소스, IP 주소, 사용자로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">모든 액션</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <Button onClick={handleExport} disabled={isPending} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </div>

        {/* 날짜 필터 */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
              placeholder="시작일"
            />
          </div>
          <span className="text-muted-foreground">~</span>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
              placeholder="종료일"
            />
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시간</TableHead>
              <TableHead>사용자</TableHead>
              <TableHead>액션</TableHead>
              <TableHead>리소스</TableHead>
              <TableHead>IP 주소</TableHead>
              <TableHead>상세</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  감사 로그가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    {log.user_profiles ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{log.user_profiles.name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{log.user_profiles.email}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.resource || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{log.ip_address || '-'}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>감사 로그 상세</DialogTitle>
                          <DialogDescription>
                            {format(new Date(log.created_at), 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">액션</label>
                            <div className="mt-1">
                              <Badge className={ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}>
                                {log.action}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">리소스</label>
                            <div className="mt-1 text-sm">{log.resource || '-'}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">사용자</label>
                            <div className="mt-1 text-sm">
                              {log.user_profiles ? (
                                <div>
                                  <div>{log.user_profiles.name || '-'}</div>
                                  <div className="text-muted-foreground">{log.user_profiles.email}</div>
                                </div>
                              ) : '-'}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">IP 주소</label>
                            <div className="mt-1 font-mono text-sm">{log.ip_address || '-'}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">User-Agent</label>
                            <div className="mt-1 text-sm break-all">{log.user_agent || '-'}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">상세 정보</label>
                            <pre className="mt-1 p-3 bg-slate-50 rounded-md text-xs overflow-auto max-h-64">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        총 {filteredLogs.length}개의 감사 로그
      </div>
    </div>
  )
}

