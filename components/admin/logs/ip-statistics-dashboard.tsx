'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import {
  getTopIps, getHourlyStats, getPathStats, getCountryStats, detectAnomalies,
} from '@/app/admin/logs/actions'
import { AlertTriangle, TrendingUp, Globe, Activity, MapPin, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0',
]

type TopIp = { ip_address: string; access_count: number }
type HourlyStat = { hour: string; access_count: number; unique_ips: number }
type PathStat = { path: string; access_count: number; unique_ips: number }
type CountryStat = { country: string; access_count: number; unique_ips: number }
type Anomaly = {
  ip_address: string
  access_count: number
  rate_per_minute: number
  burst_5min: number
  severity: 'high' | 'medium'
}

export function IpStatisticsDashboard() {
  const [topIps, setTopIps] = useState<TopIp[]>([])
  const [hourlyStats, setHourlyStats] = useState<HourlyStat[]>([])
  const [pathStats, setPathStats] = useState<PathStat[]>([])
  const [countryStats, setCountryStats] = useState<CountryStat[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isMounted = true
    const errors: string[] = []

    async function loadStats() {
      try {
        setError(null)

        const results = await Promise.allSettled([
          getTopIps(10),
          getHourlyStats(1),
          getPathStats(),
          getCountryStats(10),
          detectAnomalies(),
        ])

        if (!isMounted) return

        const [topIpsRes, hourlyRes, pathRes, countryRes, anomaliesRes] = results

        if (topIpsRes.status === 'fulfilled') {
          setTopIps(topIpsRes.value as TopIp[])
        } else {
          errors.push(`Top IPs: ${topIpsRes.reason?.message ?? '알 수 없는 오류'}`)
          setTopIps([])
        }

        if (hourlyRes.status === 'fulfilled') {
          setHourlyStats(hourlyRes.value as HourlyStat[])
        } else {
          errors.push(`시간대별 통계: ${hourlyRes.reason?.message ?? '알 수 없는 오류'}`)
          setHourlyStats([])
        }

        if (pathRes.status === 'fulfilled') {
          setPathStats((pathRes.value as PathStat[]).slice(0, 10))
        } else {
          errors.push(`경로별 통계: ${pathRes.reason?.message ?? '알 수 없는 오류'}`)
          setPathStats([])
        }

        if (countryRes.status === 'fulfilled') {
          setCountryStats(countryRes.value as CountryStat[])
        } else {
          errors.push(`국가별 통계: ${countryRes.reason?.message ?? '알 수 없는 오류'}`)
          setCountryStats([])
        }

        if (anomaliesRes.status === 'fulfilled') {
          setAnomalies(anomaliesRes.value as Anomaly[])
        } else {
          setAnomalies([])
        }

        if (errors.length > 0) {
          setError(`일부 통계를 불러오지 못했습니다:\n${errors.join('\n')}`)
        }
      } catch (err: unknown) {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : '통계 데이터를 불러오는 중 오류가 발생했습니다.'
        setError(`통계 데이터 로드 실패: ${message}`)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadStats()
    return () => { isMounted = false }
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setError(null)
    setLoading(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        통계 로딩 중...
      </div>
    )
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
          <div className="text-red-600 whitespace-pre-line text-sm">{error}</div>
          <div className="mt-4 p-3 bg-white rounded border border-red-200">
            <p className="text-sm font-semibold mb-2">디버깅 체크리스트</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>환경 변수 <code>SUPABASE_SERVICE_ROLE_KEY</code> 설정 여부 확인</li>
              <li>Supabase 대시보드에서 RPC 함수 설치 여부 확인 (선택사항)</li>
              <li>브라우저 개발자 도구(F12) → Console 탭 확인</li>
            </ul>
          </div>
          <div className="mt-4">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              다시 시도
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hourlyChartData = hourlyStats.map((stat) => ({
    time: new Date(stat.hour).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    접근수: stat.access_count,
    고유IP: stat.unique_ips,
  }))

  const hasAnyData =
    topIps.length > 0 ||
    hourlyStats.length > 0 ||
    pathStats.length > 0 ||
    countryStats.length > 0

  if (!hasAnyData) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        통계 데이터가 없습니다. IP 접근 로그가 기록되지 않았을 수 있습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 이상 접근 패턴 알림 */}
      {anomalies.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Shield className="h-5 w-5" />
              이상 접근 패턴 감지 ({anomalies.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.map((anomaly) => (
                <div
                  key={anomaly.ip_address}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{anomaly.ip_address}</span>
                    <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                      {anomaly.severity === 'high' ? '고위험' : '중위험'}
                    </Badge>
                    {anomaly.burst_5min >= 30 && (
                      <Badge variant="destructive" className="text-xs">
                        5분 내 {anomaly.burst_5min}회 급증
                      </Badge>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-semibold">{anomaly.access_count}회</span>
                    <span className="text-muted-foreground ml-1">
                      (분당 {anomaly.rate_per_minute}회)
                    </span>
                  </div>
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
              <div className="text-center py-8 text-muted-foreground text-sm">데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topIps.map((ip) => ({ IP: ip.ip_address, 접근수: ip.access_count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="IP" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="접근수" fill={COLORS[0]} />
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
              경로별 접근 분포 (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pathStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pathStats.map((stat) => ({ name: stat.path, value: stat.access_count }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                    outerRadius={80}
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
            <div className="text-center py-8 text-muted-foreground text-sm">데이터가 없습니다</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="접근수" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="고유IP" stroke={COLORS[1]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 국가별 접근 통계 — 바 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              국가별 접근 통계 (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                국가 데이터가 없습니다.
                <br />
                <span className="text-xs">Geolocation이 비활성화되어 있거나 로그가 없습니다.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={countryStats.map((c) => ({
                    국가: c.country,
                    접근수: c.access_count,
                    고유IP: c.unique_ips,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="국가" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="접근수" fill={COLORS[4]} />
                  <Bar dataKey="고유IP" fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 국가별 상세 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              국가별 상세 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">데이터가 없습니다</div>
            ) : (
              <div className="space-y-2">
                {countryStats.map((c, index) => (
                  <div
                    key={c.country}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium text-sm">{c.country}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{c.access_count.toLocaleString()}회</div>
                      <div className="text-xs text-muted-foreground">고유 IP {c.unique_ips}개</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 10 IP 상세 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 IP 상세 정보</CardTitle>
        </CardHeader>
        <CardContent>
          {topIps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">데이터가 없습니다</div>
          ) : (
            <div className="space-y-2">
              {topIps.map((ip, index) => (
                <div
                  key={ip.ip_address}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-mono font-medium text-sm">{ip.ip_address}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{ip.access_count.toLocaleString()}회</div>
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
