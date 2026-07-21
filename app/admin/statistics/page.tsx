import { StatisticsCharts } from '@/components/admin/statistics/statistics-charts'
import { PageHeader } from '@/components/layout/page-header'

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드 통계"
        description="사용자·세션 메타 통계 (IP·국가는 로그 분석 참고)"
      />
      <StatisticsCharts />
    </div>
  )
}
