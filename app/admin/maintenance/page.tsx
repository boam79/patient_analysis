import { DatabaseStats } from '@/components/admin/maintenance/database-stats'
import { SystemSettings } from '@/components/admin/maintenance/system-settings'
import { MaintenanceMode } from '@/components/admin/maintenance/maintenance-mode'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Settings } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="시스템 유지보수"
        description="데이터베이스 관리 및 시스템 설정"
      />

      {/* 유지보수 모드 */}
      <MaintenanceMode />

      {/* 탭으로 기능 분리 */}
      <Tabs defaultValue="database" className="space-y-4">
        <TabsList>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            데이터베이스
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            시스템 설정
          </TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          <DatabaseStats />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

