import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import Redis from 'ioredis';
import axios from 'axios';

@Injectable()
export class NewsService {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.redis = new Redis(configService.get<string>('REDIS_URL') || 'redis://localhost:6379');
  }

  async findAll(filters?: { category?: string; isFeatured?: boolean; limit?: number }) {
    const where: any = { isActive: true };
    if (filters?.category && filters.category !== 'all') {
      where.category = filters.category;
    }
    if (filters?.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    return this.prisma.news.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  async getAllNews(category?: string) {
    const cacheKey = `news:all:${category || 'all'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const dbNews = await this.findAll({ category });
    const externalNews = await this.fetchExternalNews(category);

    const combined = [
      ...dbNews.map((n) => ({
        id: n.id,
        title: n.title,
        summary: n.summary,
        category: n.category,
        source: n.source,
        sourceUrl: n.sourceUrl,
        imageUrl: n.imageUrl,
        tags: n.tags,
        isFeatured: n.isFeatured,
        date: n.publishedAt.toISOString().split('T')[0],
        isExternal: false,
      })),
      ...externalNews,
    ];

    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await this.redis.set(cacheKey, JSON.stringify(combined), 'EX', 1800);

    return combined;
  }

  private async fetchExternalNews(category?: string) {
    const apiKey = this.configService.get('NEWSAPI_KEY');
    if (!apiKey) return [];

    try {
      const query = this.getQueryForCategory(category);
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=es&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;

      const response = await axios.get(url, { timeout: 5000 });
      return response.data.articles
        .filter((a: any) => a.title && a.title !== '[Removed]')
        .map((a: any) => ({
          id: `ext-${Buffer.from(a.url || a.title).toString('base64').substring(0, 12)}`,
          title: a.title,
          summary: a.description || '',
          category: this.detectCategory(a),
          source: a.source?.name || 'Fuente externa',
          sourceUrl: a.url,
          imageUrl: a.urlToImage,
          tags: [],
          isFeatured: false,
          date: a.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          isExternal: true,
        }));
    } catch {
      return [];
    }
  }

  private getQueryForCategory(category?: string): string {
    switch (category) {
      case 'regional':
        return 'derecho Colombia judicial regional';
      case 'nacional':
        return 'derecho Colombia ley corte congreso';
      case 'internacional':
        return 'derecho internacional ley tribunal';
      default:
        return 'derecho ley justicia jurisprudencia';
    }
  }

  private detectCategory(article: any): string {
    const text = `${article.title} ${article.description}`.toLowerCase();
    if (text.includes('colombia') || text.includes('bogotá') || text.includes('corte constitucional')) return 'nacional';
    if (text.includes('internacional') || text.includes('europa') || text.includes('eeuu') || text.includes('onu')) return 'internacional';
    return 'nacional';
  }


}
