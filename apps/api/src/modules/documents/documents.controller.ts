import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Registrar documento subido' })
  upload(
    @CurrentUser() user: any,
    @Body()
    body: {
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
      caseId?: string;
      documentCategory?: string;
    },
  ) {
    return this.documentsService.create(user.sub, body);
  }

  @Post('upload/file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir archivo y registrar documento' })
  uploadFile(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { caseId?: string; documentCategory?: string },
  ) {
    return this.documentsService.uploadFile(user.sub, file, body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis documentos' })
  findAll(@CurrentUser() user: any, @Query('caseId') caseId?: string) {
    return this.documentsService.findAll(user.sub, caseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener documento' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.findOne(user.sub, id);
  }

  @Get(':id/content')
  @ApiOperation({ summary: 'Ver o descargar el contenido del documento (autenticado)' })
  async content(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, fileName } = await this.documentsService.getFileContent(user.sub, id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    const disposition = download ? 'attachment' : 'inline';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(fileName)}"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buffer);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar documento' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.remove(user.sub, id);
  }

  @Post(':id/open-in-google-docs')
  @ApiOperation({ summary: 'Abrir documento en Google Docs' })
  openInGoogleDocs(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.openInGoogleDocs(user.sub, id);
  }

  @Post(':id/sync-from-google')
  @ApiOperation({ summary: 'Sincronizar documento desde Google Drive' })
  syncFromGoogle(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.syncFromGoogle(user.sub, id);
  }
}
