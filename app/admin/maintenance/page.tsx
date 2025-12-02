import { DatabaseStats } from '@/components/admin/maintenance/database-stats'
import { SystemSettings } from '@/components/admin/maintenance/system-settings'
import { MaintenanceMode } from '@/components/admin/maintenance/maintenance-mode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Settings, Wrench } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">시스템 유지보수</h1>
        <p className="text-muted-foreground mt-2">
          데이터베이스 관리 및 시스템 설정
        </p>
      </div>

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

