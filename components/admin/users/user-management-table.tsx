'use client'

import { useState, useTransition } from 'react'
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
import { CheckCircle2, XCircle, Shield, Trash2, Search, Plus, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { approveUser, rejectUser, updateUserRole, deleteUser, createAdminUser } from '@/app/admin/users/actions'
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
}

export function UserManagementTable({ users: initialUsers }: UserManagementTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterApproved, setFilterApproved] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  
  // 제작자 계정 생성 모달 상태
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')

  // 필터링
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesApproved = 
      filterApproved === 'all' || 
      (filterApproved === 'approved' && user.is_approved) ||
      (filterApproved === 'pending' && !user.is_approved)
    
    return matchesSearch && matchesRole && matchesApproved
  })

  const handleApprove = async (userId: string) => {
    startTransition(async () => {
      try {
        await approveUser(userId)
        toast.success('사용자가 승인되었습니다.')
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || '승인 중 오류가 발생했습니다.')
      }
    })
  }

  const handleReject = async (userId: string) => {
    if (!confirm('정말 이 사용자의 승인을 취소하시겠습니까?')) {
      return
    }
    startTransition(async () => {
      try {
        await rejectUser(userId)
        toast.success('사용자 승인이 취소되었습니다.')
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || '승인 취소 중 오류가 발생했습니다.')
      }
    })
  }

  const handleRoleChange = async (userId: string, newRole: 'ADMIN' | 'ANALYST' | 'VIEWER' | 'USER') => {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole)
        toast.success('사용자 역할이 변경되었습니다.')
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || '역할 변경 중 오류가 발생했습니다.')
      }
    })
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('정말 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }
    startTransition(async () => {
      try {
        await deleteUser(userId)
        toast.success('사용자가 삭제되었습니다.')
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || '삭제 중 오류가 발생했습니다.')
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
      } catch (error: any) {
        toast.error(error.message || '계정 생성 중 오류가 발생했습니다.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* 필터 바 및 생성 버튼 */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이메일 또는 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">모든 역할</option>
          <option value="ADMIN">ADMIN</option>
          <option value="ANALYST">ANALYST</option>
          <option value="VIEWER">VIEWER</option>
          <option value="USER">USER</option>
        </select>
        <select
          value={filterApproved}
          onChange={(e) => setFilterApproved(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">모든 상태</option>
          <option value="approved">승인됨</option>
          <option value="pending">승인 대기</option>
        </select>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              제작자 계정 생성
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>제작자 계정 생성</DialogTitle>
              <DialogDescription>
                새로운 관리자 계정을 생성합니다. 생성된 계정은 자동으로 승인됩니다.
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
                    placeholder="admin@example.com"
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
                    placeholder="관리자 이름"
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
                    placeholder="비밀번호"
                    required
                    disabled={isPending}
                    minLength={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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

      {/* 테이블 */}
      <div className="border rounded-lg">
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
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  사용자가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value: 'ADMIN' | 'ANALYST' | 'VIEWER' | 'USER') => 
                        handleRoleChange(user.id, value)
                      }
                      disabled={isPending}
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
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        승인됨
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        승인 대기
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'yyyy-MM-dd', { locale: ko })}
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
                          disabled={isPending}
                        >
                          거부
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(user.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        총 {filteredUsers.length}명의 사용자
      </div>
    </div>
  )
}
