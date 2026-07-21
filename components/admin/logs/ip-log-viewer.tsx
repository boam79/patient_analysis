'use client'

import { useState, useTransition, useMemo } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Search, Download, Calendar, Globe, Smartphone } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { exportIpLogs } from '@/app/admin/logs/actions'
import { toast } from 'sonner'
import { parseUserAgent, getDeviceTypeLabel, type DeviceInfo } from '@/lib/user-agent-parser'

interface IpLog {
  id: string
  ip_address: string
  path: string
  method: string
  user_agent: string | null
  referer: string | null
  country: string | null
  city: string | null
  status_code: number | null
  response_time: number | null
  created_at: string
}

interface IpLogViewerProps {
  logs: IpLog[]
}

export function IpLogViewer({ logs: initialLogs }: IpLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPath, setSelectedPath] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isPending, startTransition] = useTransition()

  // 경로 목록 추출
  const paths = Array.from(new Set(initialLogs.map(log => log.path))).sort()

  // 디바이스 정보 파싱 (메모이제이션)
  const logsWithDeviceInfo = useMemo(() => {
    return initialLogs.map(log => ({
      ...log,
      deviceInfo: parseUserAgent(log.user_agent),
    }))
  }, [initialLogs])

  // 필터링
  const filteredLogs = logsWithDeviceInfo.filter((log) => {
    const matchesSearch = 
      log.ip_address.includes(searchTerm) ||
      (log.user_agent && log.user_agent.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.country && log.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.deviceInfo.device && log.deviceInfo.device.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.deviceInfo.browser && log.deviceInfo.browser.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesPath = selectedPath === 'all' || log.path === selectedPath
    const matchesStartDate = !startDate || new Date(log.created_at) >= new Date(startDate)
    const matchesEndDate = !endDate || new Date(log.created_at) <= new Date(endDate)
    
    return matchesSearch && matchesPath && matchesStartDate && matchesEndDate
  })

  const handleExport = async () => {
    startTransition(async () => {
      try {
        // 날짜 미입력 시 기본값: 최근 30일
        const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const defaultEnd = new Date().toISOString()
        const maybeIp = searchTerm.trim()
        const ipFilter = /^\d{1,3}(\.\d{1,3}){3}$/.test(maybeIp)
          ? maybeIp
          : undefined
        const data = await exportIpLogs(
          startDate ? new Date(startDate).toISOString() : defaultStart,
          endDate ? new Date(endDate + 'T23:59:59').toISOString() : defaultEnd,
          ipFilter
        )

        // CSV 변환
        const headers = ['IP 주소', '시간', '경로', '메서드', '상태 코드', '응답 시간', '국가', '도시', '디바이스', '브라우저', 'OS', 'User-Agent', 'Referer']
        const csvRows = [
          headers.join(','),
          ...data.map(log => {
            const deviceInfo = parseUserAgent(log.user_agent)
            return [
              log.ip_address,
              format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko }),
              log.path,
              log.method,
              log.status_code,
              log.response_time || '',
              log.country || '',
              log.city || '',
              deviceInfo.device || '',
              deviceInfo.browser || '',
              deviceInfo.os || '',
              `"${(log.user_agent || '').replace(/"/g, '""')}"`,
              `"${(log.referer || '').replace(/"/g, '""')}"`,
            ].join(',')
          })
        ]

        const csvContent = csvRows.join('\n')
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ip-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast.success('IP 로그가 내보내기되었습니다.')
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
                placeholder="IP 주소 또는 User-Agent로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">모든 경로</option>
            {paths.map((path) => (
              <option key={path} value={path}>
                {path}
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
              <TableHead>IP 주소</TableHead>
              <TableHead>국가</TableHead>
              <TableHead>디바이스</TableHead>
              <TableHead>시간</TableHead>
              <TableHead>경로</TableHead>
              <TableHead>메서드</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>응답 시간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  로그가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{log.ip_address}</span>
                      {log.city && (
                        <span className="text-xs text-muted-foreground">{log.city}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.country ? (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.country}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.deviceInfo.deviceType !== 'unknown' ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            {getDeviceTypeLabel(log.deviceInfo.deviceType)}
                          </Badge>
                        </div>
                        {log.deviceInfo.device && (
                          <span className="text-xs text-muted-foreground">{log.deviceInfo.device}</span>
                        )}
                        {log.deviceInfo.browser && (
                          <span className="text-xs text-muted-foreground">{log.deviceInfo.browser}</span>
                        )}
                        {log.deviceInfo.os && (
                          <span className="text-xs text-muted-foreground">{log.deviceInfo.os}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.path}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.method}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.status_code == null ? (
                      <Badge variant="outline">미수집</Badge>
                    ) : (
                      <Badge
                        variant={
                          log.status_code >= 400 ? 'destructive' : 'default'
                        }
                      >
                        {log.status_code}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.response_time ? `${log.response_time}ms` : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        총 {filteredLogs.length}개의 로그
      </div>
    </div>
  )
}
