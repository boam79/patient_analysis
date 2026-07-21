'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, XCircle, Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  approveUser,
  rejectUser,
  updateUserRole,
  deleteUser,
  createAdminUser,
} from '@/app/admin/users/actions'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  is_approved: boolean
  created_at: string
  updated_at: string
}

interface UserManagementTableProps {
  users: User[]
  approvedAdminCountHint?: number
  totalCount?: number
}

export function UserManagementTable({
  users: initialUsers,
  approvedAdminCountHint = 0,
  totalCount,
}: UserManagementTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [isPending, startTransition] = useTransition()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const handleApprove = async (userId: string) => {
    startTransition(async () => {
      try {
        await approveUser(userId)
        toast.success('사용자가 승인되었습니다.')
        router.refresh()
      } catch (error: unknown) {
        toast.error(
          error instanceof Error ? error.message : '승인 중 오류가 발생했습니다.'
        )
      }
    })
  }

  const handleReject = async (userId: string) => {
    if (!confirm('정말 이 사용자의 승인을 취소하시겠습니까?')) return
    startTransition(async () => {
      try {
        await rejectUser(userId)
        toast.success('사용자 승인이 취소되었습니다.')
        router.refresh()
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : '승인 취소 중 오류가 발생했습니다.'
        )
      }
    })
  }

  const handleRoleChange = async (
    userId: string,
    newRole: 'ADMIN' | 'ANALYST' | 'VIEWER' | 'USER'
  ) => {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole)
        toast.success('사용자 역할이 변경되었습니다.')
        router.refresh()
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : '역할 변경 중 오류가 발생했습니다.'
        )
      }
    })
  }

  const handleDelete = async (userId: string) => {
    if (
      !confirm(
        '정말 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      )
    ) {
      return
    }
    startTransition(async () => {
      try {
        await deleteUser(userId)
        toast.success('사용자가 삭제되었습니다.')
        router.refresh()
      } catch (error: unknown) {
        toast.error(
          error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.'
        )
      }
    })
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail || !newUserPassword || !newUserName) {
      toast.error('모든 필드를 입력해주세요.')
      return
    }

    startTransition(async () => {
      try {
        await createAdminUser(newUserEmail, newUserPassword, newUserName)
        toast.success('제작자 계정이 생성되었습니다.')
        setIsCreateDialogOpen(false)
        setNewUserEmail('')
        setNewUserName('')
        setNewUserPassword('')
        router.refresh()
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : '계정 생성 중 오류가 발생했습니다.'
        )
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              제작자 계정 생성
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>제작자 계정 생성</DialogTitle>
              <DialogDescription>
                새 관리자 계정(자동 승인). 비밀번호는 10자 이상, 영문+숫자.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">이메일</label>
                  <Input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">이름</label>
                  <Input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">초기 비밀번호</label>
                  <Input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    disabled={isPending}
                    minLength={10}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? '생성 중...' : '생성'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이메일</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead>액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  사용자가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isLastApprovedAdmin =
                  user.role === 'ADMIN' &&
                  user.is_approved &&
                  approvedAdminCountHint <= 1

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.name || '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(
                          value: 'ADMIN' | 'ANALYST' | 'VIEWER' | 'USER'
                        ) => handleRoleChange(user.id, value)}
                        disabled={isPending || isLastApprovedAdmin}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="ANALYST">ANALYST</SelectItem>
                          <SelectItem value="VIEWER">VIEWER</SelectItem>
                          <SelectItem value="USER">USER</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.is_approved ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          승인됨
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">
                          <XCircle className="mr-1 h-3 w-3" />
                          승인 대기
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'yyyy-MM-dd', {
                        locale: ko,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!user.is_approved ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(user.id)}
                            disabled={isPending}
                          >
                            승인
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(user.id)}
                            disabled={isPending || isLastApprovedAdmin}
                            title={
                              isLastApprovedAdmin
                                ? '마지막 관리자는 거부할 수 없습니다'
                                : undefined
                            }
                          >
                            거부
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(user.id)}
                          disabled={isPending || isLastApprovedAdmin}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        이 페이지 {users.length}명
        {typeof totalCount === 'number' ? ` · 전체 ${totalCount}명` : ''}
      </div>
    </div>
  )
}
