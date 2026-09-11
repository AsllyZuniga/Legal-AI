import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class LegislationService {
  constructor(private prisma: PrismaService) {}

  async search(query?: string, page: number = 1, limit: number = 20) {
    let data: any[];
    let total: number;

    if (query) {
      data = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM laws WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY year DESC NULLS LAST LIMIT $2 OFFSET $3`,
        `%${query}%`, limit, (page - 1) * limit
      );
      const countResult = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT count(*) as total FROM laws WHERE name ILIKE $1 OR description ILIKE $1`,
        `%${query}%`
      );
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
