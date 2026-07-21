'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ResponsiveContainer,
} from 'recharts'
import {
  getUserSignupTrend,
  getUserRoleDistribution,
  getActiveUserStats,
  getUsageStats,
  getStatisticsSummary,
} from '@/app/admin/statistics/actions'
import { Users, UserCheck, Activity, TrendingUp, Search } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function StatisticsCharts() {
  const [summary, setSummary] = useState({
    totalUsers: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
  })
  const [signupTrend, setSignupTrend] = useState<
    Array<{ month: string; count: number }>
  >([])
  const [roleDistribution, setRoleDistribution] = useState<
    Array<{ role: string; total: number; approved: number; pending: number }>
  >([])
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [summaryData, signupData, roleData, activeData, usageData] =
          await Promise.all([
            getStatisticsSummary(),
            getUserSignupTrend(12),
            getUserRoleDistribution(),
            getActiveUserStats(30),
            getUsageStats(30),
          ])

        setSummary(summaryData as typeof summary)
        setSignupTrend(signupData as Array<{ month: string; count: number }>)
        setRoleDistribution(
          roleData as Array<{
            role: string
            total: number
            approved: number
            pending: number
          }>
        )
        setActiveUserStats(activeData as typeof activeUserStats)
        setUsageStats(usageData as typeof usageStats)
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

  const hourlyData = usageStats.hourlyDistribution.map((stat) => ({
    시간: `${stat.hour}시`,
    로그인수: stat.count,
  }))

  const dailyActiveData = activeUserStats.dailyActive.map((stat) => ({
    날짜: new Date(stat.date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    }),
    활성사용자: stat.count,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUsers}</div>
            <p className="text-xs text-muted-foreground">전체 등록된 사용자</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인된 사용자</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.approvedUsers}</div>
            <p className="text-xs text-muted-foreground">승인 완료된 사용자</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingUsers}</div>
            <p className="text-xs text-muted-foreground">승인 대기 중인 사용자</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeUsers}</div>
            <p className="text-xs text-muted-foreground">최근 30일 내 로그인</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 세션</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSessions}</div>
            <p className="text-xs text-muted-foreground">전체 세션 수</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>사용자 가입 추이 (최근 12개월)</CardTitle>
          </CardHeader>
          <CardContent>
            {signupTrend.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                데이터가 없습니다
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={signupTrend.map((t) => ({ 월: t.month, 가입수: t.count }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="월" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="가입수"
                    stroke="#0088FE"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>역할별 사용자 분포</CardTitle>
          </CardHeader>
          <CardContent>
            {roleDistribution.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                데이터가 없습니다
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleDistribution.map((r) => ({
                      name: r.role,
                      value: r.total,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
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
        <Card>
          <CardHeader>
            <CardTitle>시간대별 로그인 분포 (최근 30일)</CardTitle>
          </CardHeader>
          <CardContent>
            {hourlyData.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                데이터가 없습니다
              </div>
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

        <Card>
          <CardHeader>
            <CardTitle>일별 활성 사용자 (최근 30일)</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyActiveData.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                데이터가 없습니다
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActiveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="날짜" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="활성사용자"
                    stroke="#00C49F"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>역할별 상세 통계</CardTitle>
        </CardHeader>
        <CardContent>
          {roleDistribution.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              데이터가 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {roleDistribution.map((role) => (
                <div
                  key={role.role}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="font-medium">{role.role}</div>
                    <div className="text-sm text-muted-foreground">
                      총 {role.total}명 (승인: {role.approved}명, 대기:{' '}
                      {role.pending}명)
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            IP 접근 통계
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>IP·국가·경로 통계는 로그 분석 페이지로 통합되었습니다.</p>
          <Link
            href="/admin/logs"
            className="font-medium text-primary hover:underline"
          >
            로그 분석에서 보기 →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
