'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  getUserSignupTrend,
  getUserRoleDistribution,
  getActiveUserStats,
  getUsageStats,
  getStatisticsSummary,
  getIpAccessSummary,
  getIpAccessTrend,
  getIpAccessHourlyDistribution,
  getIpAccessPathStats,
  getIpAccessCountryStats,
} from '@/app/admin/statistics/actions'
import { Users, UserCheck, Activity, TrendingUp, Globe, Search, MapPin } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function StatisticsCharts() {
  const [summary, setSummary] = useState({
    totalUsers: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
  })
  const [signupTrend, setSignupTrend] = useState<Array<{ month: string; count: number }>>([])
  const [roleDistribution, setRoleDistribution] = useState<Array<{ role: string; total: number; approved: number; pending: number }>>([])
  const [activeUserStats, setActiveUserStats] = useState({
    totalActive: 0,
    dailyActive: [] as Array<{ date: string; count: number }>,
  })
  const [usageStats, setUsageStats] = useState({
    totalLogins: 0,
    avgSessionDuration: 0,
    totalPageViews: 0,
    hourlyDistribution: [] as Array<{ hour: number; count: number }>,
  })
  const [ipAccessSummary, setIpAccessSummary] = useState({
    totalIpLogs: 0,
    todayIpLogs: 0,
    uniqueIpCount: 0,
  })
  const [ipAccessTrend, setIpAccessTrend] = useState<Array<{ date: string; count: number; uniqueIps: number }>>([])
  const [ipAccessHourly, setIpAccessHourly] = useState<Array<{ hour: number; count: number }>>([])
  const [ipAccessPathStats, setIpAccessPathStats] = useState<Array<{ path: string; count: number; uniqueIps: number }>>([])
  const [ipAccessCountryStats, setIpAccessCountryStats] = useState<Array<{ country: string; access_count: number; unique_ips: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [summaryData, signupData, roleData, activeData, usageData, ipSummary, ipTrend, ipHourly, ipPath, ipCountry] = await Promise.all([
          getStatisticsSummary(),
          getUserSignupTrend(12),
          getUserRoleDistribution(),
          getActiveUserStats(30),
          getUsageStats(30),
          getIpAccessSummary(),
          getIpAccessTrend(30),
          getIpAccessHourlyDistribution(30),
          getIpAccessPathStats(),
          getIpAccessCountryStats(10),
        ])

        setSummary(summaryData as typeof summary)
        setSignupTrend(signupData as Array<{ month: string; count: number }>)
        setRoleDistribution(roleData as Array<{ role: string; total: number; approved: number; pending: number }>)
        setActiveUserStats(activeData as typeof activeUserStats)
        setUsageStats(usageData as typeof usageStats)
        setIpAccessSummary(ipSummary as typeof ipAccessSummary)
        setIpAccessTrend(ipTrend as Array<{ date: string; count: number; uniqueIps: number }>)
        setIpAccessHourly(ipHourly as Array<{ hour: number; count: number }>)
        setIpAccessPathStats(ipPath as Array<{ path: string; count: number; uniqueIps: number }>)
        setIpAccessCountryStats(ipCountry as Array<{ country: string; access_count: number; unique_ips: number }>)
      } catch (error) {
        console.error('Failed to load statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return <div className="text-center py-8">통계 로딩 중...</div>
  }

  // 시간대별 분포 포맷팅
  const hourlyData = usageStats.hourlyDistribution.map(stat => ({
    시간: `${stat.hour}시`,
    로그인수: stat.count,
  }))

  // 일별 활성 사용자 포맷팅
  const dailyActiveData = activeUserStats.dailyActive.map(stat => ({
    날짜: new Date(stat.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    활성사용자: stat.count,
  }))

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              전체 등록된 사용자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인된 사용자</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.approvedUsers}</div>
            <p className="text-xs text-muted-foreground">
              승인 완료된 사용자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingUsers}</div>
            <p className="text-xs text-muted-foreground">
              승인 대기 중인 사용자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              최근 30일 내 로그인
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 세션</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              전체 세션 수
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 사용자 가입 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>사용자 가입 추이 (최근 12개월)</CardTitle>
          </CardHeader>
          <CardContent>
            {signupTrend.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={signupTrend.map(t => ({ 월: t.month, 가입수: t.count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="월" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="가입수" stroke="#0088FE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 역할별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>역할별 사용자 분포</CardTitle>
          </CardHeader>
          <CardContent>
            {roleDistribution.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleDistribution.map(r => ({ name: r.role, value: r.total }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleDistribution.map((_, index) => (
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* 시간대별 로그인 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>시간대별 로그인 분포 (최근 30일)</CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="시간" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="로그인수" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 일별 활성 사용자 */}
        <Card>
          <CardHeader>
            <CardTitle>일별 활성 사용자 (최근 30일)</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyActiveData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActiveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="날짜" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="활성사용자" stroke="#00C49F" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 사용량 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 로그인 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.totalLogins}</div>
            <p className="text-xs text-muted-foreground">최근 30일</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">평균 세션 지속 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.avgSessionDuration > 0
                ? `${Math.round(usageStats.avgSessionDuration / 60)}분`
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">최근 30일 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 페이지 뷰</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.totalPageViews}</div>
            <p className="text-xs text-muted-foreground">최근 30일</p>
          </CardContent>
        </Card>
      </div>

      {/* 역할별 상세 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>역할별 상세 통계</CardTitle>
        </CardHeader>
        <CardContent>
          {roleDistribution.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
          ) : (
            <div className="space-y-4">
              {roleDistribution.map((role) => (
                <div key={role.role} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{role.role}</div>
                    <div className="text-sm text-muted-foreground">
                      총 {role.total}명 (승인: {role.approved}명, 대기: {role.pending}명)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{role.total}</div>
                    <div className="text-xs text-muted-foreground">사용자</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* IP 접근 통계 섹션 */}
      <div className="border-t pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            IP 접근 통계
          </h2>
          <p className="text-muted-foreground mt-1">
            메인 대시보드 접근 로그 통계
          </p>
        </div>

        {/* IP 접근 요약 카드 */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 IP 로그</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ipAccessSummary.totalIpLogs}</div>
              <p className="text-xs text-muted-foreground">전체 IP 접근 로그 수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘 IP 로그</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ipAccessSummary.todayIpLogs}</div>
              <p className="text-xs text-muted-foreground">오늘 접근한 IP 로그 수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">고유 IP 수</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ipAccessSummary.uniqueIpCount}</div>
              <p className="text-xs text-muted-foreground">고유한 IP 주소 수</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* IP 접근 추이 (일별) */}
          <Card>
            <CardHeader>
              <CardTitle>IP 접근 추이 (최근 30일)</CardTitle>
            </CardHeader>
            <CardContent>
              {ipAccessTrend.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ipAccessTrend.map(t => ({
                    날짜: new Date(t.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
                    접근수: t.count,
                    고유IP: t.uniqueIps,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="날짜" angle={-45} textAnchor="end" height={80} />
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

          {/* IP 접근 시간대별 분포 */}
          <Card>
            <CardHeader>
              <CardTitle>IP 접근 시간대별 분포 (최근 30일)</CardTitle>
            </CardHeader>
            <CardContent>
              {ipAccessHourly.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ipAccessHourly.map(h => ({
                    시간: `${h.hour}시`,
                    접근수: h.count,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="시간" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="접근수" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* IP 접근 경로별 통계 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>IP 접근 경로별 통계 (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            {ipAccessPathStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
            ) : (
              <div className="space-y-2">
                {ipAccessPathStats.map((pathStat, index) => (
                  <div key={pathStat.path} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="font-mono font-medium">{pathStat.path}</div>
                        <div className="text-xs text-muted-foreground">
                          고유 IP: {pathStat.uniqueIps}개
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{pathStat.count}회</div>
                      <div className="text-xs text-muted-foreground">접근</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 국가별 접근 통계 */}
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {/* 국가별 접근 통계 바 차트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                국가별 접근 통계 (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ipAccessCountryStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ipAccessCountryStats.map(c => ({
                    국가: c.country,
                    접근수: c.access_count,
                    고유IP: c.unique_ips,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="국가" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="접근수" fill="#0088FE" />
                    <Bar dataKey="고유IP" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 국가별 접근 통계 파이 차트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                국가별 접근 분포
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ipAccessCountryStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ipAccessCountryStats.map(c => ({ name: c.country, value: c.access_count }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(1) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ipAccessCountryStats.map((_, index) => (
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

        {/* 국가별 상세 통계 목록 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>국가별 상세 통계 (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            {ipAccessCountryStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">데이터가 없습니다</div>
            ) : (
              <div className="space-y-2">
                {ipAccessCountryStats.map((countryStat, index) => (
                  <div key={countryStat.country} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{countryStat.country}</div>
                        <div className="text-xs text-muted-foreground">
                          고유 IP: {countryStat.unique_ips}개
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{countryStat.access_count}회</div>
                      <div className="text-xs text-muted-foreground">접근</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

