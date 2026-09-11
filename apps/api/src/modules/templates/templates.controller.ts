import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  SetMetadata,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import axios from 'axios';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir nueva plantilla' })
  uploadTemplate(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body()
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
    return this.templatesService.uploadTemplate(user.sub, file, body);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar plantilla con URL existente' })
  register(
    @CurrentUser() user: any,
    @Body()
    body: {
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
    return this.templatesService.create(user.sub, body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar plantillas con filtros avanzados' })
  findAll(
    @CurrentUser() user: any,
    @Query('legalArea') legalArea?: string,
    @Query('subcategory') subcategory?: string,
    @Query('documentType') documentType?: string,
    @Query('purpose') purpose?: string,
    @Query('vigencyStatus') vigencyStatus?: string,
    @Query('reviewYear') reviewYear?: string,
    @Query('officialSource') officialSource?: string,
    @Query('search') search?: string,
    @Query('favoritesOnly') favoritesOnly?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.templatesService.findAll({
      legalArea,
      subcategory,
      documentType,
      purpose,
      vigencyStatus,
      reviewYear,
      officialSource,
      search,
      favoritesOnly: favoritesOnly === 'true',
      userId: user?.sub,
      sortBy,
    });
  }

  @Get('filters')
  @ApiOperation({ summary: 'Obtener opciones de filtros disponibles' })
  getFilters() {
    return this.templatesService.getFilters();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Obtener categorias disponibles' })
  getCategories() {
    return this.templatesService.getCategories();
  }

  @Get('area-stats')
  @ApiOperation({ summary: 'Obtener estadisticas por area juridica' })
  getAreaStats() {
    return this.templatesService.getAreaStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plantilla por ID' })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar plantilla' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body()
    body: {
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
    },
  ) {
    return this.templatesService.update(id, user.sub, body);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Agregar o quitar de favoritos' })
  toggleFavorite(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templatesService.toggleFavorite(user.sub, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar plantilla' })
  duplicate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templatesService.duplicate(id, user.sub);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar archivo de plantilla' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const template = await this.templatesService.findOne(id);
    await this.templatesService.incrementDownload(id);

    if (template.fileUrl.startsWith('/templates/default/')) {
      const relativePath = template.fileUrl.replace(/^\//, '');
      const filePath = join(__dirname, '..', '..', '..', 'public', relativePath);
      if (existsSync(filePath)) {
        const filename = `${template.name}.${template.fileType}`;
        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        });
        return res.sendFile(filePath);
      }
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    try {
      const response = await axios.get(template.fileUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      const filename = `${template.name}.${template.fileType}`;
      res.set({
        'Content-Type': template.fileType === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : template.fileType === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': response.data.length,
      });
      res.send(response.data);
    } catch {
      return res.json({
        message: 'No se pudo descargar el archivo',
        fileUrl: template.fileUrl,
      });
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar plantilla' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templatesService.remove(id, user.sub);
  }

  @Post('seed')
  @SetMetadata('isPublic', true)
  @ApiOperation({ summary: 'Crear plantillas predeterminadas (admin)' })
  seedDefaults() {
    return this.templatesService.seedDefaultTemplates();
  }

  @Post('check-normative-updates')
  @ApiOperation({ summary: 'Verificar actualizaciones normativas' })
  checkNormativeUpdates() {
    return this.templatesService.checkNormativeUpdates();
  }
}
