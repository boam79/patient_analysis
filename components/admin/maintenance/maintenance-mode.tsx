'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { getSystemSettings, toggleMaintenanceMode } from '@/app/admin/maintenance/actions'
import { toast } from 'sonner'

export function MaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMaintenanceMode() {
      try {
        const settings = await getSystemSettings()
        const maintenanceSetting = settings.find((s: any) => s.key === 'maintenance.enabled')
        setIsMaintenanceMode(maintenanceSetting?.value === 'true')
      } catch (error) {
        console.error('Failed to load maintenance mode:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMaintenanceMode()
  }, [])

  const handleToggle = () => {
    if (!confirm(
      isMaintenanceMode
        ? '유지보수 모드를 비활성화하시겠습니까?'
        : '유지보수 모드를 활성화하시겠습니까? 일반 사용자는 시스템에 접근할 수 없게 됩니다.'
    )) {
      return
    }

    startTransition(async () => {
      try {
        await toggleMaintenanceMode(!isMaintenanceMode)
        setIsMaintenanceMode(!isMaintenanceMode)
        toast.success(
          isMaintenanceMode
            ? '유지보수 모드가 비활성화되었습니다.'
            : '유지보수 모드가 활성화되었습니다.'
        )
      } catch (error: any) {
        toast.error(error.message || '유지보수 모드 전환 중 오류가 발생했습니다.')
      }
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={isMaintenanceMode ? 'border-orange-200 bg-orange-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isMaintenanceMode ? (
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
          유지보수 모드
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isMaintenanceMode ? 'destructive' : 'default'}>
                {isMaintenanceMode ? '활성화됨' : '비활성화됨'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isMaintenanceMode
                ? '시스템이 유지보수 모드입니다. 일반 사용자는 접근할 수 없습니다.'
                : '시스템이 정상 운영 중입니다.'}
            </p>
          </div>
          <Button
            onClick={handleToggle}
            disabled={isPending}
            variant={isMaintenanceMode ? 'default' : 'destructive'}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : isMaintenanceMode ? (
              '유지보수 모드 비활성화'
            ) : (
              '유지보수 모드 활성화'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

