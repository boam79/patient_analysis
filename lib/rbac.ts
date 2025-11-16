import { prisma } from './prisma'

export type Permission = string

// 권한 확인
export async function hasPermission(
  userId: string,
  permissionName: Permission
): Promise<boolean> {
  const permission = await prisma.userPermission.findFirst({
    where: {
      userId,
      permission: {
        name: permissionName,
      },
    },
  })

  return !!permission
}

// 사용자의 모든 권한 가져오기
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const userPermissions = await prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true },
  })

  return userPermissions.map((up: any) => up.permission.name)
}

// 역할별 기본 권한
export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    'data:upload',
    'data:delete',
    'data:export',
    'report:generate',
    'report:export',
    'user:manage',
    'user:create',
    'user:delete',
    'system:settings',
    'analytics:view',
    'analytics:edit',
  ],
  ANALYST: [
    'data:upload',
    'data:export',
    'report:generate',
    'report:export',
    'analytics:view',
    'analytics:edit',
  ],
  VIEWER: [
    'analytics:view',
    'report:view',
  ],
  USER: [
    'analytics:view',
  ],
}

// 역할에 따른 권한 확인
export function hasRolePermission(role: string, permission: Permission): boolean {
  const permissions = RolePermissions[role] || []
  return permissions.includes(permission)
}

