import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import axios from 'axios';

@Injectable()
export class AnalysisService {
  private aiServiceUrl: string;
  private aiServiceSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    this.aiServiceSecret = this.configService.get<string>('AI_SERVICE_SECRET', 'CAMBIAR_POR_SEGURO');
  }

  async analyzeCase(userId: string, caseId: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        caseFacts: { orderBy: { chronologicalOrder: 'asc' } },
        caseEvents: { orderBy: { eventDate: 'asc' } },
        casePretensions: true,
        caseDefenses: true,
        caseAlerts: true,
      },
    });
    if (!caseData) throw new NotFoundException('Caso no encontrado');

    if (caseData.userId !== userId) {
      const permission = await this.prisma.casePermission.findUnique({
        where: { caseId_userId: { caseId, userId } },
      });
      if (!permission) throw new BadRequestException('No tienes acceso a este caso');
    }

    const session = await this.prisma.analysisSession.create({
      data: {
        userId,
        caseId,
        analysisType: 'full_case_analysis',
        inputData: {
          facts: caseData.caseFacts,
          events: caseData.caseEvents,
          pretensions: caseData.casePretensions,
        } as any,
      },
    });

    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/internal/analyze/case`,
        {
          case_id: caseId,
          facts: caseData.caseFacts.map((f) => ({
            fact_type: f.factType,
            description: f.description,
            event_date: f.eventDate?.toISOString() || null,
            is_juridically_relevant: f.isJuridicallyRelevant,
            verification_status: f.verificationStatus,
          })),
          events: caseData.caseEvents.map((e) => ({
            description: e.description,
            event_date: e.eventDate?.toISOString() || null,
            is_juridically_relevant: e.isJuridicallyRelevant,
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
          alerts: caseData.caseAlerts.map((a) => ({
            alert_type: a.alertType,
            title: a.title,
            description: a.description,
          })),
          legal_area: caseData.legalArea,
          description: caseData.description,
          analysis_type: 'full_case_analysis',
        },
        {
          headers: { Authorization: `Bearer ${this.aiServiceSecret}` },
          timeout: 120000,
        },
      );

      const analysisResult = response.data;

      await this.prisma.analysisSession.update({
        where: { id: session.id },
        data: {
          outputData: analysisResult.analysis as any,
          confidenceScore: analysisResult.analysis?.confidence_level || 0,
          llmModel: 'gpt-4o',
        },
      });

      if (analysisResult.analysis?.analysisFindings) {
        for (const finding of analysisResult.analysis.analysisFindings) {
          await this.prisma.analysisFinding.create({
            data: {
              sessionId: session.id,
              findingType: finding.type || 'general',
              description: finding.description,
              severity: finding.severity || 'medium',
              relatedRulingIds: finding.relatedRulingIds || [],
              metadata: finding.metadata || {},
            },
          });
        }
      }

      if (analysisResult.analysis?.relevantJurisprudence) {
        for (const source of analysisResult.analysis.relevantJurisprudence) {
          await this.prisma.analysisSource.create({
            data: {
              sessionId: session.id,
              sourceType: 'ruling',
              sourceId: source.id || '00000000-0000-0000-0000-000000000000',
              relevanceScore: source.relevance || 0,
              snippet: source.summary || source.keyHolding || '',
            },
          });
        }
      }

      if (analysisResult.analysis?.recommendation) {
        await this.prisma.analysisConclusion.create({
          data: {
            sessionId: session.id,
            conclusionType: 'recommendation',
            content: analysisResult.analysis.recommendation,
            confidenceLevel: analysisResult.analysis.confidence_level || 0,
          },
        });
      }

      return {
        sessionId: session.id,
        status: 'completed',
        analysis: analysisResult.analysis,
        message: 'Análisis completado exitosamente.',
      };
    } catch (error: any) {
      await this.prisma.analysisSession.update({
        where: { id: session.id },
        data: {
          outputData: { error: error?.message || 'Unknown error' } as any,
        },
      });

      return {
        sessionId: session.id,
        status: 'error',
        message: `Error en el análisis: ${error?.message || 'Unknown error'}`,
      };
    }
  }

  async getAnalysis(sessionId: string) {
    const session = await this.prisma.analysisSession.findUnique({
      where: { id: sessionId },
      include: {
        analysisFindings: true,
        analysisSources: true,
        analysisConclusions: true,
      },
    });
    if (!session) throw new NotFoundException('Sesión de análisis no encontrada');
    return session;
  }

  async comparePrecedents(userId: string, rulingId: string, caseId?: string) {
    const ruling = await this.prisma.ruling.findUnique({
      where: { id: rulingId },
      include: { rulingChunks: { take: 50 } },
    });
    if (!ruling) throw new NotFoundException('Sentencia no encontrada');

    let caseFacts: any[] = [];
    let caseDescription = '';
    let caseLegalArea = '';

    if (caseId) {
      const caseData = await this.prisma.case.findUnique({
        where: { id: caseId },
        include: { caseFacts: { orderBy: { chronologicalOrder: 'asc' } } },
      });
      if (caseData) {
        caseFacts = caseData.caseFacts.map((f) => ({
          fact_type: f.factType,
          description: f.description,
          event_date: f.eventDate?.toISOString() || null,
        }));
        caseDescription = caseData.description || '';
        caseLegalArea = caseData.legalArea || '';
      }
    }

    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/internal/analyze/compare`,
        {
          ruling_id: rulingId,
          ruling_citation: ruling.citation,
          ruling_summary: ruling.summary,
          ruling_full_text: ruling.fullText || ruling.rulingChunks.map((c) => c.content).join('\n'),
          case_facts: caseFacts,
          case_description: caseDescription,
          case_legal_area: caseLegalArea,
        },
        {
          headers: { Authorization: `Bearer ${this.aiServiceSecret}` },
          timeout: 120000,
        },
      );

      return {
        rulingCitation: ruling.citation,
        rulingSummary: ruling.summary,
        comparison: response.data,
        status: 'completed',
      };
    } catch (error: any) {
      return {
        rulingCitation: ruling.citation,
        rulingSummary: ruling.summary,
        status: 'error',
        message: `Error en comparación: ${error?.message || 'Unknown error'}`,
      };
    }
  }

  async analyzeEvolution(legalTopic: string, corporation: string) {
    try {
      const response = await axios.post(
        `${this.aiServiceUrl}/internal/analyze/evolution`,
        {
          legal_topic: legalTopic,
          corporation,
        },
        {
          headers: { Authorization: `Bearer ${this.aiServiceSecret}` },
          timeout: 120000,
        },
      );

      return {
        status: 'completed',
        evolution: response.data,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Error en análisis de evolución: ${error?.message || 'Unknown error'}`,
      };
    }
  }
}
