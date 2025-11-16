import { prisma } from './prisma'

export async function createAuditLog({
  userId,
  action,
  resource,
  details,
  ipAddress,
  userAgent,
}: {
  userId: string
  action: string
  resource?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

// 사용자의 최근 활동 로그 가져오기
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

// 특정 action의 로그 가져오기
export async function getActionAuditLogs(
  action: string,
  limit: number = 100
) {
  return prisma.auditLog.findMany({
    where: { action },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

