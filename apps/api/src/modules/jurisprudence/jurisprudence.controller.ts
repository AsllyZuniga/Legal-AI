import { Controller, Get, Post, Body, Param, Query, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JurisprudenceService } from './jurisprudence.service';
import { SearchRulingDto } from './dto/search-ruling.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Jurisprudence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jurisprudence')
export class JurisprudenceController {
  constructor(private jurisprudenceService: JurisprudenceService) {}

  @Post('search')
  @ApiOperation({ summary: 'Búsqueda híbrida de jurisprudencia' })
  search(@Body() dto: SearchRulingDto) {
    return this.jurisprudenceService.search(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sentencia por ID' })
  findOne(@Param('id') id: string) {
    return this.jurisprudenceService.findOne(id);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Obtener sentencias relacionadas' })
  getRelated(@Param('id') id: string) {
    return this.jurisprudenceService.getRelated(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar sentencia' })
  download(@Param('id') id: string) {
    return this.jurisprudenceService.download(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar sentencia en PDF' })
  async getPdf(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { stream, filename } = await this.jurisprudenceService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(stream);
  }

  @Get(':id/docx')
  @ApiOperation({ summary: 'Descargar documento original en Word desde la relatoria' })
  async getDocx(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { buffer, filename } = await this.jurisprudenceService.downloadOriginalDocx(id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    return new StreamableFile(buffer);
  }

  @Get(':id/excel')
  @ApiOperation({ summary: 'Descargar datos estructurados de la sentencia en Excel' })
  async getExcel(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { buffer, filename } = await this.jurisprudenceService.generateExcel(id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    return new StreamableFile(buffer);
  }
}
