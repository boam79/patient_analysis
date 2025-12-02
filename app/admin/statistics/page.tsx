import { StatisticsCharts } from '@/components/admin/statistics/statistics-charts'

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대시보드 통계</h1>
        <p className="text-muted-foreground mt-2">
          사용자 통계 및 사용량 분석
        </p>
      </div>

      <StatisticsCharts />
    </div>
  )
}

