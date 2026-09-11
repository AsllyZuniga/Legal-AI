import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import axios from 'axios';

@Injectable()
export class GenerationService {
  private aiServiceUrl: string;
  private aiServiceSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    this.aiServiceSecret = this.configService.get<string>('AI_SERVICE_SECRET', 'CAMBIAR_POR_SEGURO');
  }

  async generateDocument(
    userId: string,
    dto: { caseId: string; documentType: string; specificInstructions?: string },
  ) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: dto.caseId },
      include: {
        caseFacts: { orderBy: { chronologicalOrder: 'asc' } },
        casePretensions: true,
        caseDefenses: true,
        caseEvents: { orderBy: { eventDate: 'asc' } },
      },
    });
    if (!caseData) throw new NotFoundException('Caso no encontrado');

    if (caseData.userId !== userId) {
      const permission = await this.prisma.casePermission.findUnique({
        where: { caseId_userId: { caseId: dto.caseId, userId } },
      });
      if (!permission) throw new BadRequestException('No tienes acceso a este caso');
    }

    const relevantRulings = await this.prisma.savedRuling.findMany({
      where: { caseId: dto.caseId },
      include: { ruling: { select: { citation: true, summary: true } } },
      take: 10,
    });

    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/internal/generate/document`,
        {
          case_id: dto.caseId,
          document_type: dto.documentType,
          case_data: {
            name: caseData.name,
            description: caseData.description,
            legal_area: caseData.legalArea,
            parties: caseData.parties,
            facts: caseData.caseFacts.map((f) => ({
              fact_type: f.factType,
              description: f.description,
              event_date: f.eventDate?.toISOString() || null,
              is_juridically_relevant: f.isJuridicallyRelevant,
            })),
            events: caseData.caseEvents.map((e) => ({
              description: e.description,
              event_date: e.eventDate?.toISOString() || null,
            })),
            pretensions: caseData.casePretensions.map((p) => ({
              description: p.description,
              legal_basis: p.legalBasis,
            })),
            defenses: caseData.caseDefenses.map((d) => ({
              defense_type: d.defenseType,
              description: d.description,
              legal_basis: d.legalBasis,
            })),
          },
          specific_instructions: dto.specificInstructions,
          relevant_rulings: relevantRulings.map((sr) => ({
            citation: sr.ruling.citation,
            summary: sr.ruling.summary,
          })),
        },
        {
          headers: { Authorization: `Bearer ${this.aiServiceSecret}` },
          timeout: 180000,
        },
      );

      const result = response.data;

      const doc = await this.prisma.generatedDocument.create({
        data: {
          caseId: dto.caseId,
          userId,
          documentType: dto.documentType,
          title: result.title || `${dto.documentType} - ${caseData.name}`,
          content: result.content,
          qualityChecks: result.quality_checks as any,
          qualityPassed: result.quality_passed || false,
          llmModel: result.llm_model || 'gpt-4o',
        },
      });

      return {
        documentId: doc.id,
        status: 'completed',
        content: result.content,
        title: result.title,
        qualityChecks: result.quality_checks,
        qualityPassed: result.quality_passed,
        message: 'Documento generado exitosamente.',
      };
    } catch (error: any) {
      const doc = await this.prisma.generatedDocument.create({
        data: {
          caseId: dto.caseId,
          userId,
          documentType: dto.documentType,
          title: `${dto.documentType} - ${caseData.name}`,
          content: `[ERROR] No se pudo generar el documento: ${error?.message || 'Unknown error'}`,
          qualityPassed: false,
          llmModel: 'gpt-4o',
        },
      });

      return {
        documentId: doc.id,
        status: 'error',
        message: `Error generando documento: ${error?.message || 'Unknown error'}`,
      };
    }
  }

  async getDocument(userId: string, documentId: string) {
    const doc = await this.prisma.generatedDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    if (doc.userId !== userId) throw new NotFoundException('No tienes acceso');
    return doc;
  }

  async getDocumentsByCase(userId: string, caseId: string) {
    return this.prisma.generatedDocument.findMany({
      where: { caseId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
