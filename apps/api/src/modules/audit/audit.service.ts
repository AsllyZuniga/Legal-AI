import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, action: string, resourceType?: string, resourceId?: string, details?: any, ipAddress?: string) {
    return this.prisma.auditLog.create({
      data: {
        userId: userId,
        action,
        resourceType: resourceType,
        resourceId: resourceId,
        ipAddress: ipAddress,
        details: details || {},
      },
    });
  }

  async findAll(filters?: { userId?: string; action?: string; limit?: number }) {
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
  }
}
