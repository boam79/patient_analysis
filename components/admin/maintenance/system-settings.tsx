'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Settings, Edit, Plus, Save } from 'lucide-react'
import { getSystemSettings, updateSystemSetting } from '@/app/admin/maintenance/actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface SystemSetting {
  id: string
  key: string
  value: string
  description: string | null
  updated_at: string
  updated_by: string | null
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSystemSettings()
        setSettings(data as SystemSetting[])
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key)
    setEditValue(setting.value)
    setEditDescription(setting.description || '')
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingKey) return

    startTransition(async () => {
      try {
        await updateSystemSetting(
          editingKey,
          editValue,
          editDescription || undefined
        )
        toast.success('시스템 설정이 업데이트되었습니다.')
        setIsDialogOpen(false)
        setEditingKey(null)
        
        // 설정 목록 새로고침
        const data = await getSystemSettings()
        setSettings(data as SystemSetting[])
      } catch (error: any) {
        toast.error(error.message || '설정 업데이트 중 오류가 발생했습니다.')
      }
    })
  }

  if (loading) {
    return <div className="text-center py-8">시스템 설정 로딩 중...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            시스템 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                설정이 없습니다
              </div>
            ) : (
              settings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{setting.key}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {setting.description || '설명 없음'}
                    </div>
                    <div className="text-sm font-mono bg-slate-50 p-2 rounded">
                      {setting.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      업데이트: {format(new Date(setting.updated_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(setting)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 편집 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시스템 설정 편집</DialogTitle>
            <DialogDescription>
              설정 키: {editingKey}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>값</Label>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="설정 값"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>설명 (선택사항)</Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="설정 설명"
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

