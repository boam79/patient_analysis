'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { Search, Eye, Download, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  exportErrorLogs,
  resolveErrorLog,
} from '@/app/admin/errors/actions'
import { toast } from 'sonner'

interface ErrorLog {
  id: number
  boundary: string
  message: string
  stack: string | null
  digest: string | null
  path: string | null
  user_agent: string | null
  ip_address: string | null
  created_at: string
  resolved?: boolean
}

interface ErrorLogViewerProps {
  logs: ErrorLog[]
  boundary?: string
  resolvedFilter?: string
}

const BOUNDARY_COLORS: Record<string, string> = {
  app: 'bg-blue-100 text-blue-800',
  global: 'bg-red-100 text-red-800',
  dashboard: 'bg-purple-100 text-purple-800',
  admin: 'bg-orange-100 text-orange-800',
}

export function ErrorLogViewer({
  logs,
  boundary = 'all',
  resolvedFilter = 'all',
}: ErrorLogViewerProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isPending, startTransition] = useTransition()

  const boundaries = Array.from(new Set(logs.map((log) => log.boundary))).sort()

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.path && log.path.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const applyServerFilters = (next: {
    boundary?: string
    resolved?: string
  }) => {
    const b = next.boundary ?? boundary
    const r = next.resolved ?? resolvedFilter
    const q = new URLSearchParams()
    q.set('page', '1')
    q.set('boundary', b)
    q.set('resolved', r)
    if (startDate) q.set('start', new Date(startDate).toISOString())
    if (endDate) q.set('end', new Date(endDate).toISOString())
    if (searchTerm.trim()) q.set('q', searchTerm.trim())
    router.push(`/admin/errors?${q.toString()}`)
  }

  const handleExport = () => {
    startTransition(async () => {
      try {
        const defaultStart = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString()
        const data = await exportErrorLogs(
          startDate ? new Date(startDate).toISOString() : defaultStart,
          endDate ? new Date(endDate).toISOString() : new Date().toISOString(),
          boundary
        )
        const header =
          'id,created_at,boundary,message,path,digest,ip_address,resolved\n'
        const rows = data
          .map((log: any) =>
            [
              log.id,
              log.created_at,
              log.boundary,
              JSON.stringify(log.message ?? ''),
              log.path ?? '',
              log.digest ?? '',
              log.ip_address ?? '',
              log.resolved ?? false,
            ].join(',')
          )
          .join('\n')
        const blob = new Blob([header + rows], {
          type: 'text/csv;charset=utf-8;',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `error-logs-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('CSV 내보내기 완료')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '내보내기 실패')
      }
    })
  }

  const handleResolve = (id: number, resolved: boolean) => {
    startTransition(async () => {
      try {
        await resolveErrorLog(id, resolved)
        toast.success(resolved ? '해결 처리됨' : '다시 열림')
        router.refresh()
      } catch (e) {
        toast.error(
          e instanceof Error
            ? e.message
            : '상태 변경 실패 (resolved 컬럼 마이그레이션 확인)'
        )
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="에러 메시지, 경로로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-auto"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-auto"
        />
        <select
          value={boundary}
          onChange={(e) => applyServerFilters({ boundary: e.target.value })}
          className="rounded-md border px-3 py-2"
        >
          <option value="all">모든 영역</option>
          {boundaries.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={resolvedFilter}
          onChange={(e) => applyServerFilters({ resolved: e.target.value })}
          className="rounded-md border px-3 py-2"
        >
          <option value="all">전체 상태</option>
          <option value="open">미해결</option>
          <option value="resolved">해결됨</option>
        </select>
        <Button
          variant="outline"
          onClick={() => applyServerFilters({})}
          disabled={isPending}
        >
          적용
        </Button>
        <Button variant="outline" onClick={handleExport} disabled={isPending}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시간</TableHead>
              <TableHead>영역</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>메시지</TableHead>
              <TableHead>경로</TableHead>
              <TableHead>상세</TableHead>
              <TableHead>처리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  에러 로그가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss', {
                      locale: ko,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        BOUNDARY_COLORS[log.boundary] ||
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {log.boundary}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.resolved ? 'secondary' : 'destructive'}>
                      {log.resolved ? '해결' : '미해결'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.message}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.path || '-'}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>에러 로그 상세</DialogTitle>
                          <DialogDescription>
                            {format(
                              new Date(log.created_at),
                              'yyyy년 MM월 dd일 HH:mm:ss',
                              { locale: ko }
                            )}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">메시지</label>
                            <div className="mt-1 break-all text-sm">
                              {log.message}
                            </div>
                          </div>
                          {log.stack && (
                            <div>
                              <label className="text-sm font-medium">
                                스택 트레이스
                              </label>
                              <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-slate-50 p-3 text-xs">
                                {log.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleResolve(log.id, !log.resolved)}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      {log.resolved ? '재오픈' : '해결'}
                    </Button>
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
