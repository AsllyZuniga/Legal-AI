import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { JurisprudenceService } from '../jurisprudence/jurisprudence.service';
import axios from 'axios';
import {
  generateCitationResponse,
  generateTopicResponse,
  generateLawResponse,
  generateFollowUpResponse,
  generateFallbackResponse,
  extractConversationTitle,
} from './local-response';

function nullToUndefined<T>(val: T | null): T | undefined {
  return val === null ? undefined : val;
}

@Injectable()
export class ChatService {
  private aiServiceUrl: string;
  private aiServiceSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jurisprudenceService: JurisprudenceService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    this.aiServiceSecret = this.configService.get<string>('AI_SERVICE_SECRET', 'CAMBIAR_POR_SEGURO');
  }

  async createConversation(userId: string, dto: { title?: string; caseId?: string; analysisMode?: string }) {
    return this.prisma.conversation.create({
      data: {
        userId,
        caseId: dto.caseId,
        title: dto.title || 'Nueva conversación',
        analysisMode: dto.analysisMode || 'general_chat',
      },
    });
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
  }

  async getMessages(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    if (conversation.userId !== userId) throw new ForbiddenException('No tienes acceso');
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    if (conversation.userId !== userId) throw new ForbiddenException('No tienes acceso');

    await this.prisma.message.create({
      data: { conversationId, role: 'user', content },
    });

    const previousMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const conversationHistory = previousMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const isFollowUp = this.isFollowUpQuestion(content, previousMessages);

    let result: { response: string; citations: any[]; sources: any[]; confidence: number };

    try {
      result = await this.searchAndRespondLocal(content, conversation.caseId ?? undefined, conversationHistory, isFollowUp);
    } catch {
      result = await this.searchAndRespondFallback(content);
    }

    const aiResponse = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: result.response,
        citations: result.citations,
        sources: result.sources,
        modelUsed: 'local-search',
        confidenceScore: result.confidence,
      },
    });

    const messageCount = await this.prisma.message.count({ where: { conversationId } });
    if (messageCount <= 2 && (!conversation.title || conversation.title === 'Nueva conversación')) {
      const autoTitle = extractConversationTitle(content);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { title: autoTitle },
      });
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return aiResponse;
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    if (conversation.userId !== userId) throw new ForbiddenException('No tienes acceso');
    return this.prisma.conversation.delete({ where: { id: conversationId } });
  }

  private isFollowUpQuestion(query: string, previousMessages: any[]): boolean {
    if (previousMessages.length === 0) return false;

    const followUpPatterns = [
      /cuéntame más/i, /explícame/i, /¿por qué/i, /¿cómo/i,
      /¿qué dijo/i, /¿cuál fue/i, /detállame/i, /háblame de/i,
      /qué opinas/i, /cuáles son las/i, /resumen/i, /amplíame/i,
      /profundiza/i, /desarrolla/i, /analiza/i, /compara/i,
      /diferencia/i, /relación/i, /consecuencia/i, /implicación/i,
      /decisión/i, /resuelve/i, /fallo/i, /norma/i, /ley/i,
      /artículo/i, /tema/i, /asunto/i, /materia/i,
      /síntesis/i, /explica/i, /sobre qué/i,
    ];

    return followUpPatterns.some(p => p.test(query));
  }

  private async searchAndRespondLocal(
    query: string,
    caseId?: string,
    conversationHistory: any[] = [],
    isFollowUp: boolean = false,
  ) {
    const citationMatch = query.match(/([TC]-\d+\/\d+|SC-\d+-\d+)/i);

    if (citationMatch) {
      const ruling = await this.prisma.ruling.findFirst({
        where: {
          citation: { contains: citationMatch[1], mode: 'insensitive' },
        },
      });

      if (ruling) {
        const response = generateCitationResponse(
          {
            id: ruling.id,
            citation: ruling.citation,
            corporation: nullToUndefined(ruling.corporation),
            chamber: nullToUndefined(ruling.chamber),
            magistratePonent: nullToUndefined(ruling.magistratePonent),
            rulingDate: nullToUndefined(ruling.rulingDate),
            processType: nullToUndefined(ruling.processType),
            legalArea: nullToUndefined(ruling.legalArea),
            themes: ruling.themes as string[] | undefined,
            summary: nullToUndefined(ruling.summary),
            resuelve: nullToUndefined(ruling.resuelve),
            fullText: nullToUndefined(ruling.fullText),
            referencedNorms: ruling.referencedNorms as string[] | undefined,
            sourceUrl: nullToUndefined(ruling.sourceUrl),
          },
          query,
        );

        return {
          response,
          citations: [{ text: ruling.citation, rulingId: ruling.id }],
          sources: [{
            id: ruling.id,
            type: 'ruling',
            title: ruling.citation,
            snippet: (ruling.summary || ruling.resuelve || '').substring(0, 200),
            hasPdf: !!ruling.fullText && ruling.fullText.length > 0,
            hasDocx: !!ruling.sourceUrl,
            sourceUrl: ruling.sourceUrl,
          }],
          confidence: 0.9,
        };
      }
    }

    if (isFollowUp && conversationHistory.length > 0) {
      const previousAssistantMsg = [...conversationHistory].reverse().find(m => m.role === 'assistant');
      const previousCitations = previousAssistantMsg ? this.extractCitationsFromContent(previousAssistantMsg.content) : [];

      if (previousCitations.length > 0) {
        const rulings = await this.prisma.ruling.findMany({
          where: {
            citation: { in: previousCitations },
          },
          take: 5,
        });

        if (rulings.length > 0) {
          const response = generateFollowUpResponse(
            {
              rulings: rulings.map(r => ({
                id: r.id,
                citation: r.citation,
                corporation: nullToUndefined(r.corporation),
                chamber: nullToUndefined(r.chamber),
                magistratePonent: nullToUndefined(r.magistratePonent),
                rulingDate: nullToUndefined(r.rulingDate),
                processType: nullToUndefined(r.processType),
                legalArea: nullToUndefined(r.legalArea),
                themes: r.themes as string[] | undefined,
                summary: nullToUndefined(r.summary),
                resuelve: nullToUndefined(r.resuelve),
                fullText: nullToUndefined(r.fullText),
                referencedNorms: r.referencedNorms as string[] | undefined,
                sourceUrl: nullToUndefined(r.sourceUrl),
              })),
              query,
            },
            query,
          );

          return {
            response,
            citations: rulings.map(r => ({ text: r.citation, rulingId: r.id })),
            sources: rulings.map(r => ({
              id: r.id,
              type: 'ruling',
              title: r.citation,
              snippet: (r.summary || r.resuelve || '').substring(0, 200),
              hasPdf: !!r.fullText && r.fullText.length > 0,
              hasDocx: !!r.sourceUrl,
              sourceUrl: r.sourceUrl,
            })),
            confidence: 0.8,
          };
        }
      }
    }

    const isLawQuery = this.isLawQuery(query);
    if (isLawQuery) {
      const laws = await this.searchLaws(query);
      if (laws.length > 0) {
        const response = generateLawResponse(
          laws.map(l => ({
            id: l.id,
            name: l.name,
            number: l.number,
            year: l.year,
            type: l.type,
            subtipo: l.subtipo,
            sector: l.sector,
            entidad: l.entidad,
            materia: l.materia,
            description: l.description,
            vigencia: l.vigencia,
            sourceUrl: l.sourceUrl,
          })),
          query,
        );

        return {
          response,
          citations: [],
          sources: [],
          confidence: 0.7,
        };
      }
    }

    const searchResults = await this.searchRulings(query);

    if (searchResults.length > 0) {
      const response = generateTopicResponse(
        searchResults.map(r => ({
          id: r.id,
          citation: r.citation,
          corporation: nullToUndefined(r.corporation),
          chamber: nullToUndefined(r.chamber),
          magistratePonent: nullToUndefined(r.magistrate_ponent),
          rulingDate: nullToUndefined(r.ruling_date),
          processType: nullToUndefined(r.process_type),
          legalArea: nullToUndefined(r.legal_area),
          themes: r.themes as string[] | undefined,
          summary: nullToUndefined(r.summary),
          resuelve: nullToUndefined(r.resuelve),
          fullText: nullToUndefined(r.full_text),
          referencedNorms: r.referenced_norms as string[] | undefined,
          sourceUrl: nullToUndefined(r.source_url),
        })),
        query,
      );

      return {
        response,
        citations: searchResults.map(r => ({ text: r.citation, rulingId: r.id })),
        sources: searchResults.map(r => ({
          id: r.id,
          type: 'ruling',
          title: r.citation,
          snippet: (r.summary || r.resuelve || '').substring(0, 200),
          hasPdf: !!r.fullText && r.fullText.length > 0,
          hasDocx: !!r.sourceUrl,
          sourceUrl: r.sourceUrl,
        })),
        confidence: 0.8,
      };
    }

    const response = generateFallbackResponse(query);
    return {
      response,
      citations: [],
      sources: [],
      confidence: 0.3,
    };
  }

  private extractCitationsFromContent(content: string): string[] {
    const matches = content.match(/[TC]-\d+\/\d+|SC-\d+-\d+/gi);
    return matches ? [...new Set(matches)] : [];
  }

  private isLawQuery(query: string): boolean {
    const lawPatterns = [
      /\bley\b/i, /\bcódigo\b/i, /\bdecreto\b/i, /\bresolución\b/i,
      /\bnorma\b/i, /\bartículo\b/i, /\bconstitución\b/i,
      /\bconcordancia\b/i, /\breglamento\b/i,
    ];
    return lawPatterns.some(p => p.test(query));
  }

  private async searchRulings(query: string): Promise<any[]> {
    const keywords = query.split(/\s+/).filter(w => w.length > 2).slice(0, 8);
    if (keywords.length === 0) return [];

    const conditions = keywords.map((_, i) => {
      const paramIdx = i + 1;
      return `(summary ILIKE $${paramIdx} OR citation ILIKE $${paramIdx} OR process_type ILIKE $${paramIdx} OR radicado ILIKE $${paramIdx} OR magistrate_ponent ILIKE $${paramIdx} OR full_text ILIKE $${paramIdx})`;
    });
    const params: string[] = [];
    keywords.forEach(k => params.push(`%${k}%`));

    const relevanceScore = keywords.map((_, i) => {
      const paramIdx = i + 1;
      return `(CASE WHEN summary ILIKE $${paramIdx} THEN 1 ELSE 0 END) + (CASE WHEN citation ILIKE $${paramIdx} THEN 1 ELSE 0 END) + (CASE WHEN full_text ILIKE $${paramIdx} THEN 1 ELSE 0 END)`;
    }).join(' + ');

    const sql = `SELECT id, citation, corporation, chamber, magistrate_ponent, ruling_date, legal_area, themes, summary, resuelve, full_text, source_url, referenced_norms, process_type, radicado
     FROM rulings
     WHERE ${conditions.join(' OR ')}
     ORDER BY (${relevanceScore}) DESC, ruling_date DESC
     LIMIT 30`;

    return this.prisma.$queryRawUnsafe<any[]>(sql, ...params);
  }

  private async searchLaws(query: string): Promise<any[]> {
    const keywords = query.split(/\s+/).filter(w => w.length > 2).slice(0, 8);
    if (keywords.length === 0) return [];

    const conditions = keywords.map((_, i) => {
      const paramIdx = i + 1;
      return `(name ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR materia ILIKE $${paramIdx})`;
    });
    const params: string[] = [];
    keywords.forEach(k => params.push(`%${k}%`));

    const relevanceScore = keywords.map((_, i) => {
      const paramIdx = i + 1;
      return `(CASE WHEN name ILIKE $${paramIdx} THEN 2 ELSE 0 END) + (CASE WHEN description ILIKE $${paramIdx} THEN 1 ELSE 0 END)`;
    }).join(' + ');

    const sql = `SELECT id, name, number, year, type, subtipo, sector, entidad, materia, description, vigencia, source_url
     FROM laws
     WHERE ${conditions.join(' OR ')}
     ORDER BY (${relevanceScore}) DESC, year DESC NULLS LAST
     LIMIT 30`;

    return this.prisma.$queryRawUnsafe<any[]>(sql, ...params);
  }

  private async searchAndRespondFallback(query: string) {
    const keywords = query.split(/\s+/).filter((w) => w.length > 2);
    let rulings: any[] = [];

    if (keywords.length > 0) {
      const conditions = keywords.map((_, i) => {
        const paramIdx = i + 1;
        return `(summary ILIKE $${paramIdx} OR citation ILIKE $${paramIdx} OR process_type ILIKE $${paramIdx} OR radicado ILIKE $${paramIdx} OR magistrate_ponent ILIKE $${paramIdx} OR full_text ILIKE $${paramIdx})`;
      });
      const params: string[] = [];
      keywords.forEach((k) => params.push(`%${k}%`));

      const relevanceScore = keywords.map((_, i) => {
        const paramIdx = i + 1;
        return `(CASE WHEN summary ILIKE $${paramIdx} THEN 1 ELSE 0 END) + (CASE WHEN citation ILIKE $${paramIdx} THEN 1 ELSE 0 END) + (CASE WHEN full_text ILIKE $${paramIdx} THEN 1 ELSE 0 END)`;
      }).join(' + ');

      const sql = `SELECT id, citation, corporation, chamber, magistrate_ponent, ruling_date, legal_area, themes, summary, resuelve, full_text, source_url, referenced_norms, process_type, radicado
       FROM rulings
       WHERE ${conditions.join(' OR ')}
       ORDER BY (${relevanceScore}) DESC, ruling_date DESC
       LIMIT 30`;

      rulings = await this.prisma.$queryRawUnsafe<any[]>(sql, ...params);
    }

    if (!rulings || rulings.length === 0) {
      const allRulings = await this.prisma.ruling.findMany({ orderBy: { rulingDate: 'desc' }, take: 20 });

      if (allRulings.length === 0) {
        return {
          response: generateFallbackResponse(query),
          citations: [],
          sources: [],
          confidence: 0.3,
        };
      }

      let resp = `No encontré sentencias específicas para "${query}". Te muestro las más recientes:\n\n`;
      const citations: any[] = [];
      const sources: any[] = [];

      for (let i = 0; i < allRulings.length; i++) {
        const r = allRulings[i];
        const date = r.rulingDate ? new Date(r.rulingDate).toLocaleDateString('es-CO') : 'N/A';
        resp += `### ${r.citation}\n*${date}*\n\n`;
        resp += `${r.summary || 'Sin resumen disponible'}\n\n`;
        citations.push({ text: r.citation, rulingId: r.id });
        sources.push({
          id: r.id,
          type: 'ruling',
          title: r.citation,
          sourceUrl: r.sourceUrl,
          hasPdf: !!r.fullText && r.fullText.length > 0,
          hasDocx: !!r.sourceUrl,
        });
      }

      resp += `---\nIntenta con términos más específicos como el nombre de una sentencia, una norma o un tema concreto.`;
      return { response: resp, citations, sources, confidence: 0.4 };
    }

    const response = generateTopicResponse(
      rulings.map(r => ({
        id: r.id,
        citation: r.citation,
        corporation: nullToUndefined(r.corporation),
        chamber: nullToUndefined(r.chamber),
        magistratePonent: nullToUndefined(r.magistrate_ponent),
        rulingDate: nullToUndefined(r.ruling_date),
        processType: nullToUndefined(r.process_type),
        legalArea: nullToUndefined(r.legal_area),
        themes: r.themes as string[] | undefined,
        summary: nullToUndefined(r.summary),
        resuelve: nullToUndefined(r.resuelve),
        fullText: nullToUndefined(r.full_text),
        referencedNorms: r.referenced_norms as string[] | undefined,
        sourceUrl: nullToUndefined(r.source_url),
      })),
      query,
    );

    const citations = rulings.map(r => ({ text: r.citation, rulingId: r.id }));
    const sources = rulings.map(r => ({
      id: r.id,
      type: 'ruling',
      title: r.citation,
      sourceUrl: r.source_url,
      hasPdf: !!r.full_text && r.full_text.length > 0,
      hasDocx: !!r.source_url,
    }));

    return { response, citations, sources, confidence: 0.6 };
  }
}
