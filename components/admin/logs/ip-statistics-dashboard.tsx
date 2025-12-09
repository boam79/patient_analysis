'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { getTopIps, getHourlyStats, getPathStats, detectAnomalies } from '@/app/admin/logs/actions'
import { AlertTriangle, TrendingUp, Globe, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0']

export function IpStatisticsDashboard() {
  const [topIps, setTopIps] = useState<Array<{ ip_address: string; access_count: number }>>([])
  const [hourlyStats, setHourlyStats] = useState<Array<{ hour: string; access_count: number; unique_ips: number }>>([])
  const [pathStats, setPathStats] = useState<Array<{ path: string; access_count: number; unique_ips: number }>>([])
  const [anomalies, setAnomalies] = useState<Array<{ ip_address: string; access_count: number; rate: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isMounted = true
    const errors: string[] = []
    
    async function loadStats() {
      try {
        console.log('[IpStatisticsDashboard] Loading IP statistics...')
        setError(null)
        
        // 각 함수를 개별적으로 호출하여 어느 것이 실패하는지 확인
        let topIpsData: any = null
        let hourlyData: any = null
        let pathData: any = null
        let anomaliesData: any = null
        
        try {
          console.log('[IpStatisticsDashboard] Calling getTopIps...')
          const result = await getTopIps(10)
          console.log('[IpStatisticsDashboard] getTopIps result:', result, 'type:', typeof result, 'isArray:', Array.isArray(result))
          
          if (!isMounted) return
          
          if (Array.isArray(result)) {
            topIpsData = result
          } else {
            console.warn('[IpStatisticsDashboard] getTopIps returned non-array:', result)
            topIpsData = []
            errors.push('Top IPs 데이터 형식 오류')
          }
        } catch (err: any) {
          console.error('[IpStatisticsDashboard] getTopIps failed:', err)
          console.error('[IpStatisticsDashboard] Error details:', {
            message: err?.message,
            stack: err?.stack,
            name: err?.name,
            cause: err?.cause,
          })
          if (!isMounted) return
          topIpsData = []
          errors.push(`Top IPs: ${err?.message || '알 수 없는 오류'}`)
        }
        
        try {
          console.log('[IpStatisticsDashboard] Calling getHourlyStats...')
          const result = await getHourlyStats(1)
          console.log('[IpStatisticsDashboard] getHourlyStats result:', result, 'type:', typeof result, 'isArray:', Array.isArray(result))
          
          if (!isMounted) return
          
          if (Array.isArray(result)) {
            hourlyData = result
          } else {
            console.warn('[IpStatisticsDashboard] getHourlyStats returned non-array:', result)
            hourlyData = []
            errors.push('시간대별 통계 데이터 형식 오류')
          }
        } catch (err: any) {
          console.error('[IpStatisticsDashboard] getHourlyStats failed:', err)
          console.error('[IpStatisticsDashboard] Error details:', {
            message: err?.message,
            stack: err?.stack,
            name: err?.name,
            cause: err?.cause,
          })
          if (!isMounted) return
          hourlyData = []
          errors.push(`시간대별 통계: ${err?.message || '알 수 없는 오류'}`)
        }
        
        try {
          console.log('[IpStatisticsDashboard] Calling getPathStats...')
          const result = await getPathStats()
          console.log('[IpStatisticsDashboard] getPathStats result:', result, 'type:', typeof result, 'isArray:', Array.isArray(result))
          
          if (!isMounted) return
          
          if (Array.isArray(result)) {
            pathData = result
          } else {
            console.warn('[IpStatisticsDashboard] getPathStats returned non-array:', result)
            pathData = []
            errors.push('경로별 통계 데이터 형식 오류')
          }
        } catch (err: any) {
          console.error('[IpStatisticsDashboard] getPathStats failed:', err)
          console.error('[IpStatisticsDashboard] Error details:', {
            message: err?.message,
            stack: err?.stack,
            name: err?.name,
            cause: err?.cause,
          })
          if (!isMounted) return
          pathData = []
          errors.push(`경로별 통계: ${err?.message || '알 수 없는 오류'}`)
        }
        
        try {
          console.log('[IpStatisticsDashboard] Calling detectAnomalies...')
          const result = await detectAnomalies()
          console.log('[IpStatisticsDashboard] detectAnomalies result:', result)
          
          if (!isMounted) return
          
          if (Array.isArray(result)) {
            anomaliesData = result
          } else {
            anomaliesData = []
          }
        } catch (err: any) {
          console.error('[IpStatisticsDashboard] detectAnomalies failed:', err)
          // 이상 패턴 감지는 선택사항이므로 에러를 무시
          if (!isMounted) return
          anomaliesData = []
        }

        if (!isMounted) return

        console.log('[IpStatisticsDashboard] All data loaded:', {
          topIps: topIpsData,
          hourly: hourlyData,
          path: pathData,
          anomalies: anomaliesData,
          errors: errors.length > 0 ? errors : undefined,
        })

        // 데이터 유효성 검사 및 기본값 설정
        const validTopIps = Array.isArray(topIpsData) ? topIpsData : []
        const validHourly = Array.isArray(hourlyData) ? hourlyData : []
        const validPath = Array.isArray(pathData) ? pathData : []
        const validAnomalies = Array.isArray(anomaliesData) ? anomaliesData : []

        console.log('[IpStatisticsDashboard] Setting state with:', {
          topIpsCount: validTopIps.length,
          hourlyCount: validHourly.length,
          pathCount: validPath.length,
          anomaliesCount: validAnomalies.length,
        })

        setTopIps(validTopIps as Array<{ ip_address: string; access_count: number }>)
        setHourlyStats(validHourly as Array<{ hour: string; access_count: number; unique_ips: number }>)
        setPathStats(validPath.slice(0, 10) as Array<{ path: string; access_count: number; unique_ips: number }>)
        setAnomalies(validAnomalies)
        
        // 에러 메시지 설정
        if (errors.length > 0) {
          const errorMessage = `일부 통계를 불러오지 못했습니다:\n${errors.join('\n')}\n\n브라우저 콘솔을 확인하세요.`
          setError(errorMessage)
        } else if (
          validTopIps.length === 0 &&
          validHourly.length === 0 &&
          validPath.length === 0
        ) {
          setError('통계 데이터가 없습니다. IP 접근 로그가 기록되지 않았을 수 있습니다.')
        } else {
          setError(null)
        }
      } catch (error: any) {
        if (!isMounted) return
        
        console.error('[IpStatisticsDashboard] Failed to load statistics:', error)
        const errorMessage = error?.message || error?.toString() || '통계 데이터를 불러오는 중 오류가 발생했습니다.'
        console.error('[IpStatisticsDashboard] Error details:', {
          message: errorMessage,
          stack: error?.stack,
          error: error,
        })
        setError(`통계 데이터 로드 실패: ${errorMessage}\n\n브라우저 콘솔을 확인하세요.`)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadStats()
    
    return () => {
      isMounted = false
    }
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setError(null)
    setLoading(true)
  }

  if (loading) {
    return <div className="text-center py-8">통계 로딩 중...</div>
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            오류 발생
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 whitespace-pre-line">{error}</div>
          <div className="mt-4 p-3 bg-white rounded border border-red-200">
            <p className="text-sm font-semibold mb-2">디버깅 정보:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>브라우저 개발자 도구(F12) → Console 탭 확인</li>
              <li>Network 탭에서 실패한 요청 확인</li>
              <li>서버 로그 확인 (Vercel 대시보드)</li>
              <li>환경 변수 SUPABASE_SERVICE_ROLE_KEY 설정 확인</li>
            </ul>
          </div>
          <div className="mt-4">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 시간대별 차트 데이터 포맷팅
  const hourlyChartData = hourlyStats.map(stat => ({
    time: new Date(stat.hour).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    접근수: stat.access_count,
    고유IP: stat.unique_ips,
  }))

  return (
    <div className="space-y-6">
      {/* 이상 접근 패턴 알림 */}
      {anomalies.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              이상 접근 패턴 감지
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.map((anomaly) => (
                <div key={anomaly.ip_address} className="flex items-center justify-between p-2 bg-white rounded">
                  <div>
                    <span className="font-mono font-medium">{anomaly.ip_address}</span>
                    <Badge variant="destructive" className="ml-2">
                      초당 {anomaly.rate}회
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {anomaly.access_count}회 접근
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top 10 IP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top 10 접근 IP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topIps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topIps.map(ip => ({ IP: ip.ip_address, 접근수: ip.access_count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="IP" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="접근수" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 경로별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              경로별 접근 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pathStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pathStats.map(stat => ({ name: stat.path, value: stat.access_count }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pathStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 시간대별 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            시간대별 접근 추이 (최근 24시간)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hourlyChartData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="접근수" stroke="#0088FE" strokeWidth={2} />
                <Line type="monotone" dataKey="고유IP" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top 10 IP 상세 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 IP 상세 정보</CardTitle>
        </CardHeader>
        <CardContent>
          {topIps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
          ) : (
            <div className="space-y-2">
              {topIps.map((ip, index) => (
                <div key={ip.ip_address} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-mono font-medium">{ip.ip_address}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{ip.access_count}회</div>
                    <div className="text-xs text-muted-foreground">접근</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

