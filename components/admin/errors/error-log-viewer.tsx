'use client'

import { useState } from 'react'
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
import { Search, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

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
}

interface ErrorLogViewerProps {
  logs: ErrorLog[]
}

const BOUNDARY_COLORS: Record<string, string> = {
  app: 'bg-blue-100 text-blue-800',
  global: 'bg-red-100 text-red-800',
  dashboard: 'bg-purple-100 text-purple-800',
  admin: 'bg-orange-100 text-orange-800',
}

export function ErrorLogViewer({ logs }: ErrorLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBoundary, setSelectedBoundary] = useState<string>('all')

  const boundaries = Array.from(new Set(logs.map((log) => log.boundary))).sort()

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.path && log.path.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesBoundary = selectedBoundary === 'all' || log.boundary === selectedBoundary

    return matchesSearch && matchesBoundary
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="에러 메시지, 경로로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={selectedBoundary}
          onChange={(e) => setSelectedBoundary(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">모든 영역</option>
          {boundaries.map((boundary) => (
            <option key={boundary} value={boundary}>
              {boundary}
            </option>
          ))}
        </select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시간</TableHead>
              <TableHead>영역</TableHead>
              <TableHead>메시지</TableHead>
              <TableHead>경로</TableHead>
              <TableHead>상세</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  에러 로그가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                  </TableCell>
                  <TableCell>
                    <Badge className={BOUNDARY_COLORS[log.boundary] || 'bg-gray-100 text-gray-800'}>
                      {log.boundary}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{log.message}</TableCell>
                  <TableCell className="font-mono text-sm">{log.path || '-'}</TableCell>
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
                            {format(new Date(log.created_at), 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">영역</label>
                            <div className="mt-1">
                              <Badge className={BOUNDARY_COLORS[log.boundary] || 'bg-gray-100 text-gray-800'}>
                                {log.boundary}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">메시지</label>
                            <div className="mt-1 text-sm break-all">{log.message}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">경로</label>
                            <div className="mt-1 font-mono text-sm">{log.path || '-'}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Digest</label>
                            <div className="mt-1 font-mono text-sm">{log.digest || '-'}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">IP 주소 / User-Agent</label>
                            <div className="mt-1 text-sm break-all">
                              {log.ip_address || '-'} / {log.user_agent || '-'}
                            </div>
                          </div>
                          {log.stack && (
                            <div>
                              <label className="text-sm font-medium">스택 트레이스</label>
                              <pre className="mt-1 p-3 bg-slate-50 rounded-md text-xs overflow-auto max-h-64">
                                {log.stack}
                              </pre>
                            </div>
                          )}
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

      <div className="text-sm text-muted-foreground">총 {filteredLogs.length}개의 에러 로그</div>
    </div>
  )
}
