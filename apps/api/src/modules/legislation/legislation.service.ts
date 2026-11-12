import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class LegislationService {
  constructor(private prisma: PrismaService) {}

  async search(query?: string, page: number = 1, limit: number = 20) {
    let data: any[];
    let total: number;

    if (query) {
      const pattern = `%${query}%`;
      data = await this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM laws
        WHERE name ILIKE ${pattern} OR description ILIKE ${pattern}
        ORDER BY year DESC NULLS LAST
        LIMIT ${limit} OFFSET ${(page - 1) * limit}`);
      const countResult = await this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT count(*) as total FROM laws
        WHERE name ILIKE ${pattern} OR description ILIKE ${pattern}`);
      total = Number(countResult[0]?.total || 0);
    } else {
      data = await this.prisma.law.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { year: 'desc' },
      });
      total = await this.prisma.law.count();
    }

    return { laws: data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    return this.prisma.law.findUnique({
      where: { id },
      include: { lawChunks: { take: 100 } },
    });
  }
}
