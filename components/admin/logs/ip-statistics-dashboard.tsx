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

  useEffect(() => {
    async function loadStats() {
      try {
        console.log('[IpStatisticsDashboard] Loading IP statistics...')
        
        // 각 함수를 개별적으로 호출하여 어느 것이 실패하는지 확인
        let topIpsData: any = null
        let hourlyData: any = null
        let pathData: any = null
        let anomaliesData: any = null
        
        try {
          console.log('[IpStatisticsDashboard] Calling getTopIps...')
          topIpsData = await getTopIps(10)
          console.log('[IpStatisticsDashboard] getTopIps result:', topIpsData, 'type:', typeof topIpsData, 'isArray:', Array.isArray(topIpsData))
        } catch (err: any) {
          console.error('[IpStatisticsDashboard] getTopIps failed:', err)
          console.error('[IpStatisticsDashboard] Error stack:', err?.stack)
          // 에러를 다시 던지지 않고 빈 배열로 설정하여 다른 통계는 계속 로드
          topIpsData = []
          setError(`Top IPs 조회 실패: ${err?.message || '알 수 없는 오류'}. 다른 통계는 계속 로드됩니다.`)
        }
        
        try {
          console.log('[IpStatisticsDashboard] Calling getHourlyStats...')
          hourlyData = await getHourlyStats(1)
          console.log('[IpStatisticsDashboard] getHourlyStats result:', hourlyData, 'type:', typeof hourlyData, 'isArray:', Array.isArray(hourlyData))
        } catch (err: any) {
          console.error('[IpStatisticsDashboard] getHourlyStats failed:', err)
          console.error('[IpStatisticsDashboard] Error stack:', err?.stack)
          hourlyData = []
          setError(`시간대별 통계 조회 실패: ${err?.message || '알 수 없는 오류'}. 다른 통계는 계속 로드됩니다.`)
        }
        
        try {
          console.log('[IpStatisticsDashboard] Calling getPathStats...')
          pathData = await getPathStats()
          console.log('[IpStatisticsDashboard] getPathStats result:', pathData, 'type:', typeof pathData, 'isArray:', Array.isArray(pathData))
        } catch (err: any) {
          console.error('[IpStatisticsDashboard] getPathStats failed:', err)
          console.error('[IpStatisticsDashboard] Error stack:', err?.stack)
          pathData = []
          setError(`경로별 통계 조회 실패: ${err?.message || '알 수 없는 오류'}. 다른 통계는 계속 로드됩니다.`)
        }
        
        try {
          console.log('[IpStatisticsDashboard] Calling detectAnomalies...')
          anomaliesData = await detectAnomalies()
          console.log('[IpStatisticsDashboard] detectAnomalies result:', anomaliesData)
        } catch (err: any) {
          console.error('[IpStatisticsDashboard] detectAnomalies failed:', err)
          // 이상 패턴 감지는 선택사항이므로 에러를 무시
          anomaliesData = []
        }

        console.log('[IpStatisticsDashboard] All data loaded:', {
          topIps: topIpsData,
          hourly: hourlyData,
          path: pathData,
          anomalies: anomaliesData,
        })

        // 데이터 유효성 검사 및 기본값 설정
        if (!Array.isArray(topIpsData)) {
          console.error('[IpStatisticsDashboard] topIpsData is not an array:', topIpsData, typeof topIpsData)
          topIpsData = []
        }
        if (!Array.isArray(hourlyData)) {
          console.error('[IpStatisticsDashboard] hourlyData is not an array:', hourlyData, typeof hourlyData)
          hourlyData = []
        }
        if (!Array.isArray(pathData)) {
          console.error('[IpStatisticsDashboard] pathData is not an array:', pathData, typeof pathData)
          pathData = []
        }

        console.log('[IpStatisticsDashboard] Setting state with:', {
          topIpsCount: Array.isArray(topIpsData) ? topIpsData.length : 0,
          hourlyCount: Array.isArray(hourlyData) ? hourlyData.length : 0,
          pathCount: Array.isArray(pathData) ? pathData.length : 0,
          anomaliesCount: Array.isArray(anomaliesData) ? anomaliesData.length : 0,
        })

        setTopIps(Array.isArray(topIpsData) ? topIpsData as Array<{ ip_address: string; access_count: number }> : [])
        setHourlyStats(Array.isArray(hourlyData) ? hourlyData as Array<{ hour: string; access_count: number; unique_ips: number }> : [])
        setPathStats(Array.isArray(pathData) ? pathData.slice(0, 10) as Array<{ path: string; access_count: number; unique_ips: number }> : [])
        setAnomalies(Array.isArray(anomaliesData) ? anomaliesData : [])
        
        // 모든 데이터가 비어있으면 에러 메시지 설정
        if (
          (!topIpsData || topIpsData.length === 0) &&
          (!hourlyData || hourlyData.length === 0) &&
          (!pathData || pathData.length === 0)
        ) {
          setError('통계 데이터를 불러올 수 없습니다. 브라우저 콘솔을 확인하거나 관리자에게 문의하세요.')
        }
      } catch (error: any) {
        console.error('[IpStatisticsDashboard] Failed to load statistics:', error)
        const errorMessage = error?.message || error?.toString() || '통계 데이터를 불러오는 중 오류가 발생했습니다.'
        console.error('[IpStatisticsDashboard] Error details:', {
          message: errorMessage,
          stack: error?.stack,
          error: error,
        })
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return <div className="text-center py-8">통계 로딩 중...</div>
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">오류 발생</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            브라우저 콘솔을 확인하세요.
          </p>
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

