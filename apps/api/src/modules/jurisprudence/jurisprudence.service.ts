import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SearchRulingDto } from './dto/search-ruling.dto';
import PDFDocument = require('pdfkit');
import { PassThrough } from 'stream';
import axios from 'axios';
import * as ExcelJS from 'exceljs';

@Injectable()
export class JurisprudenceService {
  constructor(private prisma: PrismaService) {}

  async search(dto: SearchRulingDto) {
    const where: any = {};
    if (dto.corporation) where.corporation = dto.corporation;
    if (dto.legalArea) where.legalArea = dto.legalArea;
    if (dto.radicado) where.radicado = dto.radicado;
    if (dto.dateFrom || dto.dateTo) {
      where.rulingDate = {};
      if (dto.dateFrom) where.rulingDate.gte = new Date(dto.dateFrom);
      if (dto.dateTo) where.rulingDate.lte = new Date(dto.dateTo);
    }
    if (dto.query) {
      where.OR = [
        { citation: { contains: dto.query, mode: 'insensitive' } },
        { summary: { contains: dto.query, mode: 'insensitive' } },
        { resuelve: { contains: dto.query, mode: 'insensitive' } },
      ];
    }

    const page = dto.page || 1;
    const limit = dto.limit || 20;

    const [data, total] = await Promise.all([
      this.prisma.ruling.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rulingDate: 'desc' },
        select: {
          id: true, citation: true, rulingType: true, corporation: true,
          chamber: true, magistratePonent: true, rulingDate: true,
          legalArea: true, themes: true, summary: true, sourceUrl: true,
          radicado: true, referencedNorms: true,
        },
      }),
      this.prisma.ruling.count({ where }),
    ]);

    return { rulings: data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const ruling = await this.prisma.ruling.findUnique({
      where: { id },
      include: {
        rulingChunks: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });
    if (!ruling) throw new NotFoundException('Sentencia no encontrada');
    return ruling;
  }

  async getRelated(id: string) {
    const ruling = await this.prisma.ruling.findUnique({ where: { id } });
    if (!ruling) throw new NotFoundException('Sentencia no encontrada');

    const relationships = await this.prisma.judgmentRelationship.findMany({
      where: {
        OR: [{ sourceRulingId: id }, { targetRulingId: id }],
      },
      include: {
        sourceRuling: { select: { id: true, citation: true, corporation: true, summary: true } },
        targetRuling: { select: { id: true, citation: true, corporation: true, summary: true } },
      },
    });

    return relationships;
  }

  async download(id: string) {
    const ruling = await this.prisma.ruling.findUnique({
      where: { id },
      select: { id: true, citation: true, pdfUrl: true, sourceUrl: true, fullText: true },
    });
    if (!ruling) throw new NotFoundException('Sentencia no encontrada');
    return ruling;
  }

  async generatePdf(id: string): Promise<{ stream: PassThrough; filename: string }> {
    const ruling = await this.prisma.ruling.findUnique({
      where: { id },
      select: {
        id: true,
        citation: true,
        corporation: true,
        chamber: true,
        magistratePonent: true,
        rulingDate: true,
        processType: true,
        radicado: true,
        legalArea: true,
        themes: true,
        summary: true,
        resuelve: true,
        fullText: true,
        sourceUrl: true,
      },
    });

    if (!ruling) throw new NotFoundException('Sentencia no encontrada');

    const doc = new PDFDocument({
      margin: 50,
      info: {
        Title: ruling.citation || 'Sentencia',
        Author: 'Legal AI - Asistente Jurídico',
        Subject: ruling.corporation || '',
      },
    });

    const stream = new PassThrough();

    doc.pipe(stream);

    doc.fontSize(20).font('Helvetica-Bold').text(ruling.citation || 'Sentencia', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(12).font('Helvetica').text(ruling.corporation || '', { align: 'center' });
    if (ruling.chamber) {
      doc.text(`Sala: ${ruling.chamber}`, { align: 'center' });
    }
    if (ruling.magistratePonent) {
      doc.text(`Magistrado Ponente: ${ruling.magistratePonent}`, { align: 'center' });
    }
    if (ruling.rulingDate) {
      doc.text(`Fecha: ${new Date(ruling.rulingDate).toLocaleDateString('es-CO')}`, { align: 'center' });
    }
    if (ruling.radicado) {
      doc.text(`Radicado: ${ruling.radicado}`, { align: 'center' });
    }
    if (ruling.processType) {
      doc.text(`Tipo de Proceso: ${ruling.processType}`, { align: 'center' });
    }

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#cccccc');
    doc.moveDown(1);

    if (ruling.legalArea) {
      doc.fontSize(11).font('Helvetica-Bold').text(`Área Legal: `, { continued: true });
      doc.font('Helvetica').text(ruling.legalArea);
      doc.moveDown(0.5);
    }

    if (ruling.themes && Array.isArray(ruling.themes) && ruling.themes.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('Temas:');
      doc.font('Helvetica').fontSize(10).text(ruling.themes.join(', '));
      doc.moveDown(0.5);
    }

    if (ruling.summary) {
      doc.fontSize(14).font('Helvetica-Bold').text('Resumen');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(ruling.summary, { align: 'justify' });
      doc.moveDown(1);
    }

    if (ruling.resuelve) {
      doc.fontSize(14).font('Helvetica-Bold').text('Resuelve');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(ruling.resuelve, { align: 'justify' });
      doc.moveDown(1);
    }

    if (ruling.fullText && ruling.fullText.length > 0) {
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').text('Texto Completo');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(ruling.fullText, { align: 'justify' });
    } else {
      doc.fontSize(11).font('Helvetica-Oblique').text(
        'El texto completo de esta sentencia no está disponible en el sistema.',
        { align: 'center' }
      );
    }

    if (ruling.sourceUrl) {
      doc.moveDown(1);
      doc.fontSize(9).font('Helvetica-Oblique').text(
        `Fuente original: ${ruling.sourceUrl}`,
        { align: 'center', link: ruling.sourceUrl }
      );
    }

    doc.end();

    const safeCitation = (ruling.citation || 'sentencia').replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${safeCitation}.pdf`;

    return { stream, filename };
  }

  async hasFullText(id: string): Promise<boolean> {
    const ruling = await this.prisma.ruling.findUnique({
      where: { id },
      select: { fullText: true },
    });
    return !!ruling?.fullText && ruling.fullText.length > 0;
  }

  private citationToDocxUrl(citation: string): string | null {
    const match = citation.match(/^([A-Z]+)-(\d+)\/(\d{2})$/);
    if (!match) return null;
    const [, type, number, twoDigitYear] = match;
    const yearNum = parseInt(twoDigitYear, 10);
    const fullYear = yearNum >= 92 ? 1900 + yearNum : 2000 + yearNum;
    const filename = `${type}-${number}-${twoDigitYear}.rtf`;
    return `https://www.corteconstitucional.gov.co/sentencias/${fullYear}/${filename}`;
  }

  async downloadOriginalDocx(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const ruling = await this.prisma.ruling.findUnique({
      where: { id },
      select: { id: true, citation: true, sourceUrl: true },
    });
    if (!ruling) throw new NotFoundException('Sentencia no encontrada');

    let docxUrl = this.citationToDocxUrl(ruling.citation);
    if (!docxUrl && ruling.sourceUrl) {
      const relatoriaMatch = ruling.sourceUrl.match(/relatoria\/(\d{4})\/([A-Z]+)-(\d+)-(\d{2})\.htm/i);
      if (relatoriaMatch) {
        const [, year, type, number, yy] = relatoriaMatch;
        docxUrl = `https://www.corteconstitucional.gov.co/sentencias/${year}/${type}-${number}-${yy}.rtf`;
      }
    }

    if (!docxUrl) {
      throw new NotFoundException('URL del documento original no disponible');
    }

    try {
      const response = await axios.get(docxUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'LegalAI-Asistente/1.0',
          'Accept': '*/*',
        },
      });
      const safeCitation = (ruling.citation || 'sentencia').replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `${safeCitation}.docx`;
      return { buffer: Buffer.from(response.data), filename };
    } catch (error) {
      throw new NotFoundException('No se pudo descargar el documento original de la relatoria');
    }
  }

  async generateExcel(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const ruling = await this.prisma.ruling.findUnique({
      where: { id },
      select: {
        id: true,
        citation: true,
        corporation: true,
        chamber: true,
        magistratePonent: true,
        rulingDate: true,
        processType: true,
        radicado: true,
        legalArea: true,
        themes: true,
        subthemes: true,
        summary: true,
        resuelve: true,
        sourceUrl: true,
        referencedNorms: true,
        citedRulings: true,
      },
    });
    if (!ruling) throw new NotFoundException('Sentencia no encontrada');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Legal AI - Asistente Jurídico';
    workbook.created = new Date();

    const sheet1 = workbook.addWorksheet('Datos de la Sentencia');
    sheet1.columns = [
      { header: 'Campo', key: 'field', width: 25 },
      { header: 'Valor', key: 'value', width: 60 },
    ];
    sheet1.getRow(1).font = { bold: true };
    sheet1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    const dataRows = [
      { field: 'Citación', value: ruling.citation || 'N/A' },
      { field: 'Corporación', value: ruling.corporation || 'N/A' },
      { field: 'Sala', value: ruling.chamber || 'N/A' },
      { field: 'Magistrado Ponente', value: ruling.magistratePonent || 'N/A' },
      { field: 'Fecha de Sentencia', value: ruling.rulingDate ? new Date(ruling.rulingDate).toLocaleDateString('es-CO') : 'N/A' },
      { field: 'Tipo de Proceso', value: ruling.processType || 'N/A' },
      { field: 'Radicado', value: ruling.radicado || 'N/A' },
      { field: 'Área Legal', value: ruling.legalArea || 'N/A' },
      { field: 'Temas', value: Array.isArray(ruling.themes) ? (ruling.themes as string[]).join(', ') : 'N/A' },
      { field: 'Subtemas', value: Array.isArray(ruling.subthemes) ? (ruling.subthemes as string[]).join(', ') : 'N/A' },
      { field: 'URL Original', value: ruling.sourceUrl || 'N/A' },
    ];
    for (const row of dataRows) {
      sheet1.addRow(row);
    }

    const sheet2 = workbook.addWorksheet('Resumen y Resuelve');
    sheet2.columns = [
      { header: 'Sección', key: 'section', width: 20 },
      { header: 'Contenido', key: 'content', width: 100 },
    ];
    sheet2.getRow(1).font = { bold: true };
    sheet2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    sheet2.addRow({ section: 'Resumen', content: ruling.summary || 'No disponible' });
    sheet2.addRow({ section: 'Resuelve', content: ruling.resuelve || 'No disponible' });
    sheet2.getRow(2).height = 100;
    sheet2.getRow(3).height = 100;

    const sheet3 = workbook.addWorksheet('Normas Referenciadas');
    sheet3.columns = [
      { header: 'Norma', key: 'norm', width: 80 },
    ];
    sheet3.getRow(1).font = { bold: true };
    sheet3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    const norms = Array.isArray(ruling.referencedNorms) ? (ruling.referencedNorms as string[]) : [];
    if (norms.length > 0) {
      for (const norm of norms) {
        sheet3.addRow({ norm });
      }
    } else {
      sheet3.addRow({ norm: 'No hay normas referenciadas disponibles' });
    }

    const sheet4 = workbook.addWorksheet('Jurisprudencia Citada');
    sheet4.columns = [
      { header: 'Sentencia Citada', key: 'citation', width: 80 },
    ];
    sheet4.getRow(1).font = { bold: true };
    sheet4.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    const citedRulings = Array.isArray(ruling.citedRulings) ? (ruling.citedRulings as string[]) : [];
    if (citedRulings.length > 0) {
      for (const cited of citedRulings) {
        sheet4.addRow({ citation: cited });
      }
    } else {
      sheet4.addRow({ citation: 'No hay jurisprudencia citada disponible' });
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const safeCitation = (ruling.citation || 'sentencia').replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `${safeCitation}.xlsx`;
    return { buffer, filename };
  }
}
