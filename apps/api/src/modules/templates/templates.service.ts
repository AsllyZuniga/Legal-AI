import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MinioService } from '../../common/services/minio.service';
import { getComprehensiveSeedData } from './seed-data';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class TemplatesService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  private templateFileExists(fileUrl: string): boolean {
    if (!fileUrl.startsWith('/templates/default/')) return true;
    const relativePath = fileUrl.replace(/^\//, '');
    const filePath = join(__dirname, '..', '..', '..', 'public', relativePath);
    return existsSync(filePath);
  }

  async onModuleInit() {
    await this.cleanupOrphanTemplates();
    const count = await this.prisma.legalTemplate.count();
    if (count === 0) {
      console.log('📋 Seeding default templates...');
      await this.seedDefaultTemplates();
      console.log('✅ Default templates seeded');
    }
  }

  private async cleanupOrphanTemplates() {
    const allTemplates = await this.prisma.legalTemplate.findMany({
      where: { isDefault: true },
      select: { id: true, name: true, fileUrl: true },
    });

    const orphanIds: string[] = [];
    for (const t of allTemplates) {
      if (!this.templateFileExists(t.fileUrl)) {
        orphanIds.push(t.id);
      }
    }

    if (orphanIds.length > 0) {
      await this.prisma.legalTemplate.deleteMany({
        where: { id: { in: orphanIds } },
      });
      console.log(`🧹 Cleaned up ${orphanIds.length} orphan templates (files not found)`);
    }
  }

  async create(
    userId: string,
    dto: {
      name: string;
      description?: string;
      legalArea: string;
      subcategory?: string;
      documentType: string;
      purpose?: string;
      fileType?: string;
      tags?: string[];
      jurisdiction?: string;
      fileUrl: string;
      fileSize?: number;
      vigencyStatus?: string;
      lastReviewDate?: string;
      reviewYear?: number;
      relatedNorms?: string[];
      relatedJurisprudence?: string[];
      officialSource?: string;
      sourceUrl?: string;
      vigencyNotes?: string;
      normVersion?: string;
    },
  ) {
    return this.prisma.legalTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        legalArea: dto.legalArea,
        subcategory: dto.subcategory,
        documentType: dto.documentType,
        purpose: dto.purpose,
        fileType: dto.fileType || 'docx',
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        tags: dto.tags || [],
        jurisdiction: dto.jurisdiction || 'Colombia',
        isDefault: false,
        uploadedBy: userId,
        vigencyStatus: dto.vigencyStatus || 'vigente',
        lastReviewDate: dto.lastReviewDate ? new Date(dto.lastReviewDate) : new Date(),
        reviewYear: dto.reviewYear || new Date().getFullYear(),
        relatedNorms: dto.relatedNorms || [],
        relatedJurisprudence: dto.relatedJurisprudence || [],
        officialSource: dto.officialSource,
        sourceUrl: dto.sourceUrl,
        vigencyNotes: dto.vigencyNotes,
        normVersion: dto.normVersion,
      },
    });
  }

  async uploadTemplate(
    userId: string,
    file: Express.Multer.File,
    body: {
      name: string;
      description?: string;
      legalArea: string;
      subcategory?: string;
      documentType: string;
      purpose?: string;
      tags?: string;
      jurisdiction?: string;
      vigencyStatus?: string;
      lastReviewDate?: string;
      reviewYear?: string;
      relatedNorms?: string;
      relatedJurisprudence?: string;
      officialSource?: string;
      sourceUrl?: string;
      vigencyNotes?: string;
      normVersion?: string;
    },
  ) {
    const { fileUrl } = await this.minioService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const tags = body.tags ? body.tags.split(',').map((t: string) => t.trim()) : [];
    const relatedNorms = body.relatedNorms ? body.relatedNorms.split(',').map((t: string) => t.trim()) : [];
    const relatedJurisprudence = body.relatedJurisprudence ? body.relatedJurisprudence.split(',').map((t: string) => t.trim()) : [];
    const fileType = file.originalname.split('.').pop()?.toLowerCase() || 'docx';

    return this.prisma.legalTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        legalArea: body.legalArea,
        subcategory: body.subcategory,
        documentType: body.documentType,
        purpose: body.purpose,
        fileType,
        fileUrl,
        fileSize: file.size,
        tags,
        jurisdiction: body.jurisdiction || 'Colombia',
        isDefault: false,
        uploadedBy: userId,
        vigencyStatus: body.vigencyStatus || 'vigente',
        lastReviewDate: body.lastReviewDate ? new Date(body.lastReviewDate) : new Date(),
        reviewYear: body.reviewYear ? parseInt(body.reviewYear) : new Date().getFullYear(),
        relatedNorms,
        relatedJurisprudence,
        officialSource: body.officialSource,
        sourceUrl: body.sourceUrl,
        vigencyNotes: body.vigencyNotes,
        normVersion: body.normVersion,
      },
    });
  }

  async findAll(filters: {
    legalArea?: string;
    subcategory?: string;
    documentType?: string;
    purpose?: string;
    vigencyStatus?: string;
    reviewYear?: string;
    officialSource?: string;
    search?: string;
    isDefault?: boolean;
    favoritesOnly?: boolean;
    userId?: string;
    sortBy?: string;
  }) {
    const where: any = {};
    if (filters.legalArea) where.legalArea = filters.legalArea;
    if (filters.subcategory) where.subcategory = filters.subcategory;
    if (filters.documentType) where.documentType = filters.documentType;
    if (filters.purpose) where.purpose = filters.purpose;
    if (filters.vigencyStatus) where.vigencyStatus = filters.vigencyStatus;
    if (filters.reviewYear) where.reviewYear = parseInt(filters.reviewYear);
    if (filters.officialSource) where.officialSource = filters.officialSource;
    if (filters.isDefault !== undefined) where.isDefault = filters.isDefault;

    if (filters.favoritesOnly && filters.userId) {
      where.favorites = { some: { userId: filters.userId } };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { subcategory: { contains: filters.search, mode: 'insensitive' } },
        { tags: { array_contains: filters.search.toLowerCase() } },
      ];
    }

    let orderBy: any = [{ isDefault: 'desc' }, { downloadCount: 'desc' }, { createdAt: 'desc' }];
    if (filters.sortBy === 'recent') orderBy = [{ updatedAt: 'desc' }];
    if (filters.sortBy === 'popular') orderBy = [{ downloadCount: 'desc' }];
    if (filters.sortBy === 'favorites') orderBy = [{ favoriteCount: 'desc' }];
    if (filters.sortBy === 'name') orderBy = [{ name: 'asc' }];

    const templates = await this.prisma.legalTemplate.findMany({
      where,
      orderBy,
      include: {
        favorites: filters.userId
          ? { where: { userId: filters.userId }, select: { id: true } }
          : false,
      },
    });

    const filteredTemplates = templates.filter((t) => this.templateFileExists(t.fileUrl));

    return filteredTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      legalArea: t.legalArea,
      subcategory: t.subcategory,
      documentType: t.documentType,
      purpose: t.purpose,
      fileType: t.fileType,
      fileSize: t.fileSize,
      fileUrl: t.fileUrl,
      tags: t.tags,
      jurisdiction: t.jurisdiction,
      isDefault: t.isDefault,
      downloadCount: t.downloadCount,
      favoriteCount: t.favoriteCount,
      vigencyStatus: t.vigencyStatus,
      lastReviewDate: t.lastReviewDate,
      reviewYear: t.reviewYear,
      relatedNorms: t.relatedNorms,
      relatedJurisprudence: t.relatedJurisprudence,
      officialSource: t.officialSource,
      sourceUrl: t.sourceUrl,
      vigencyNotes: t.vigencyNotes,
      normVersion: t.normVersion,
      needsRevision: t.needsRevision,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      isFavorite: Array.isArray(t.favorites) ? t.favorites.length > 0 : false,
    }));
  }

  async getFilters() {
    const templates = await this.prisma.legalTemplate.findMany({
      select: {
        legalArea: true,
        subcategory: true,
        documentType: true,
        purpose: true,
        vigencyStatus: true,
        reviewYear: true,
        officialSource: true,
        fileUrl: true,
      },
    });

    const validTemplates = templates.filter((t) => this.templateFileExists(t.fileUrl));

    const legalAreas = [...new Set(validTemplates.map((t) => t.legalArea).filter(Boolean))];
    const documentTypes = [...new Set(validTemplates.map((t) => t.documentType).filter(Boolean))];
    const purposes = [...new Set(validTemplates.map((t) => t.purpose).filter(Boolean))];
    const vigencyStatuses = [...new Set(validTemplates.map((t) => t.vigencyStatus).filter(Boolean))];
    const reviewYears = [...new Set(validTemplates.map((t) => t.reviewYear).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));
    const officialSources = [...new Set(validTemplates.map((t) => t.officialSource).filter(Boolean))];

    const subcategoriesByArea: Record<string, string[]> = {};
    for (const t of validTemplates) {
      if (t.legalArea && t.subcategory) {
        if (!subcategoriesByArea[t.legalArea]) subcategoriesByArea[t.legalArea] = [];
        if (!subcategoriesByArea[t.legalArea].includes(t.subcategory)) {
          subcategoriesByArea[t.legalArea].push(t.subcategory);
        }
      }
    }

    return {
      legalAreas,
      documentTypes,
      purposes,
      vigencyStatuses,
      reviewYears,
      officialSources,
      subcategoriesByArea,
    };
  }

  async getCategories() {
    const templates = await this.prisma.legalTemplate.findMany({
      select: { legalArea: true, subcategory: true, documentType: true, fileUrl: true },
    });

    const validTemplates = templates.filter((t) => this.templateFileExists(t.fileUrl));

    const categories: Record<string, { subcategories: Set<string>; documentTypes: Set<string> }> = {};
    for (const t of validTemplates) {
      if (!categories[t.legalArea]) {
        categories[t.legalArea] = { subcategories: new Set(), documentTypes: new Set() };
      }
      if (t.subcategory) categories[t.legalArea].subcategories.add(t.subcategory);
      if (t.documentType) categories[t.legalArea].documentTypes.add(t.documentType);
    }

    return Object.entries(categories).map(([name, data]) => ({
      name,
      subcategories: Array.from(data.subcategories),
      documentTypes: Array.from(data.documentTypes),
    }));
  }

  async getAreaStats() {
    const templates = await this.prisma.legalTemplate.findMany({
      select: { legalArea: true, vigencyStatus: true, fileUrl: true },
    });

    const validTemplates = templates.filter((t) => this.templateFileExists(t.fileUrl));

    const stats: Record<string, { total: number; vigente: number; revision: number; obsoleta: number }> = {};
    for (const t of validTemplates) {
      if (!stats[t.legalArea]) stats[t.legalArea] = { total: 0, vigente: 0, revision: 0, obsoleta: 0 };
      stats[t.legalArea].total++;
      if (t.vigencyStatus === 'vigente') stats[t.legalArea].vigente++;
      else if (t.vigencyStatus === 'revision') stats[t.legalArea].revision++;
      else if (t.vigencyStatus === 'obsoleta') stats[t.legalArea].obsoleta++;
    }

    return stats;
  }

  async findOne(id: string) {
    const template = await this.prisma.legalTemplate.findUnique({
      where: { id },
      include: { favorites: { select: { userId: true } } },
    });
    if (!template) throw new NotFoundException('Plantilla no encontrada');
    return template;
  }

  async update(id: string, userId: string, dto: {
    name?: string;
    description?: string;
    legalArea?: string;
    subcategory?: string;
    documentType?: string;
    purpose?: string;
    tags?: string[];
    vigencyStatus?: string;
    lastReviewDate?: string;
    reviewYear?: number;
    relatedNorms?: string[];
    relatedJurisprudence?: string[];
    officialSource?: string;
    sourceUrl?: string;
    vigencyNotes?: string;
    normVersion?: string;
    needsRevision?: boolean;
    revisionReason?: string;
  }) {
    const template = await this.prisma.legalTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Plantilla no encontrada');
    if (!template.isDefault && template.uploadedBy !== userId) {
      throw new ForbiddenException('No tienes permiso para editar esta plantilla');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.legalArea !== undefined) data.legalArea = dto.legalArea;
    if (dto.subcategory !== undefined) data.subcategory = dto.subcategory;
    if (dto.documentType !== undefined) data.documentType = dto.documentType;
    if (dto.purpose !== undefined) data.purpose = dto.purpose;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.vigencyStatus !== undefined) data.vigencyStatus = dto.vigencyStatus;
    if (dto.lastReviewDate !== undefined) data.lastReviewDate = new Date(dto.lastReviewDate);
    if (dto.reviewYear !== undefined) data.reviewYear = dto.reviewYear;
    if (dto.relatedNorms !== undefined) data.relatedNorms = dto.relatedNorms;
    if (dto.relatedJurisprudence !== undefined) data.relatedJurisprudence = dto.relatedJurisprudence;
    if (dto.officialSource !== undefined) data.officialSource = dto.officialSource;
    if (dto.sourceUrl !== undefined) data.sourceUrl = dto.sourceUrl;
    if (dto.vigencyNotes !== undefined) data.vigencyNotes = dto.vigencyNotes;
    if (dto.normVersion !== undefined) data.normVersion = dto.normVersion;
    if (dto.needsRevision !== undefined) {
      data.needsRevision = dto.needsRevision;
      if (dto.needsRevision) data.vigencyStatus = 'revision';
    }
    if (dto.revisionReason !== undefined) data.revisionReason = dto.revisionReason;

    return this.prisma.legalTemplate.update({ where: { id }, data });
  }

  async toggleFavorite(userId: string, templateId: string) {
    const template = await this.prisma.legalTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Plantilla no encontrada');

    const existing = await this.prisma.templateFavorite.findUnique({
      where: { userId_templateId: { userId, templateId } },
    });

    if (existing) {
      await this.prisma.templateFavorite.delete({
        where: { userId_templateId: { userId, templateId } },
      });
      await this.prisma.legalTemplate.update({
        where: { id: templateId },
        data: { favoriteCount: { decrement: 1 } },
      });
      return { isFavorite: false };
    } else {
      await this.prisma.templateFavorite.create({
        data: { userId, templateId },
      });
      await this.prisma.legalTemplate.update({
        where: { id: templateId },
        data: { favoriteCount: { increment: 1 } },
      });
      return { isFavorite: true };
    }
  }

  async duplicate(id: string, userId: string) {
    const template = await this.prisma.legalTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Plantilla no encontrada');

    return this.prisma.legalTemplate.create({
      data: {
        name: `${template.name} (Copia)`,
        description: template.description,
        legalArea: template.legalArea,
        subcategory: template.subcategory,
        documentType: template.documentType,
        purpose: template.purpose,
        fileType: template.fileType,
        fileSize: template.fileSize,
        fileUrl: template.fileUrl,
        tags: template.tags as any,
        jurisdiction: template.jurisdiction,
        isDefault: false,
        uploadedBy: userId,
        vigencyStatus: template.vigencyStatus,
        lastReviewDate: template.lastReviewDate,
        reviewYear: template.reviewYear,
        relatedNorms: template.relatedNorms as any,
        relatedJurisprudence: template.relatedJurisprudence as any,
        officialSource: template.officialSource,
        sourceUrl: template.sourceUrl,
        vigencyNotes: template.vigencyNotes,
        normVersion: template.normVersion,
      },
    });
  }

  async incrementDownload(id: string) {
    return this.prisma.legalTemplate.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  }

  async remove(id: string, userId: string) {
    const template = await this.prisma.legalTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Plantilla no encontrada');
    if (template.isDefault) throw new ForbiddenException('No puedes eliminar plantillas del sistema');
    if (template.uploadedBy !== userId) throw new ForbiddenException('No tienes permiso para eliminar esta plantilla');
    return this.prisma.legalTemplate.delete({ where: { id } });
  }

  async checkNormativeUpdates() {
    const templates = await this.prisma.legalTemplate.findMany({
      where: { vigencyStatus: { not: 'obsoleta' } },
    });

    const currentYear = new Date().getFullYear();
    const updates: { templateId: string; reason: string }[] = [];

    for (const t of templates) {
      if (t.reviewYear && t.reviewYear < currentYear - 1) {
        await this.prisma.legalTemplate.update({
          where: { id: t.id },
          data: {
            needsRevision: true,
            revisionReason: `Plantilla no revisada desde ${t.reviewYear}. Requiere actualizacion normativa.`,
            vigencyStatus: 'revision',
          },
        });
        updates.push({ templateId: t.id, reason: `No revisada desde ${t.reviewYear}` });
      }
    }

    return { checked: templates.length, flagged: updates.length, updates };
  }

  async seedDefaultTemplates() {
    const currentYear = new Date().getFullYear();
    const reviewDate = new Date();
    const defaults = getComprehensiveSeedData();

    const driveMappingPath = join(__dirname, '..', '..', '..', 'public', 'templates', 'drive-mapping.json');
    if (existsSync(driveMappingPath)) {
      try {
        const driveMapping = JSON.parse(readFileSync(driveMappingPath, 'utf-8'));
        for (const item of driveMapping) {
          const ext = item.slug.endsWith('.doc') ? 'doc' : 'docx';
          const name = item.original_name.replace(/\.(docx?|DOCX?)$/, '');
          defaults.push({
            fileType: ext,
            fileSize: 0,
            jurisdiction: 'Colombia',
            isDefault: true,
            vigencyStatus: 'vigente',
            lastReviewDate: reviewDate,
            reviewYear: currentYear,
            relatedNorms: [],
            relatedJurisprudence: [],
            name: name,
            description: `${item.subcategory} - ${item.area}`,
            legalArea: item.area,
            subcategory: item.subcategory,
            documentType: ext === 'doc' ? 'Documento' : 'Plantilla',
            purpose: 'Modelo juridico',
            tags: [item.subcategory.toLowerCase().replace(/\s+/g, '-')],
            officialSource: 'Plantilla propia (abogado)',
            fileUrl: `/templates/default/${item.slug}`,
          });
        }
      } catch (e) {
        console.error('Error loading drive mapping:', e);
      }
    }

    let created = 0;
    for (const t of defaults) {
      const exists = await this.prisma.legalTemplate.findFirst({
        where: { name: t.name, isDefault: true },
      });
      if (!exists) {
        await this.prisma.legalTemplate.create({ data: t as any });
        created++;
      }
    }
    return { message: 'Plantillas predeterminadas creadas', total: defaults.length, created };
  }
}
