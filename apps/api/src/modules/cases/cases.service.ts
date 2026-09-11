import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCaseDto) {
    return this.prisma.case.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        legalArea: dto.legalArea,
        subarea: dto.subarea,
        processType: dto.processType,
        client: dto.client,
        court: dto.court,
        fileNumber: dto.fileNumber,
        city: dto.city,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        responsibleLawyer: dto.responsibleLawyer,
        opposingParty: dto.opposingParty,
        pretensions: dto.pretensions,
        amount: dto.amount,
        priority: dto.priority,
        parties: dto.parties as any,
        legalProblemDescription: dto.legalProblemDescription,
        additionalInfo: dto.additionalInfo,
        lastActivityAt: new Date(),
      },
    });
  }

  async findAll(userId: string, pagination: PaginationDto, filters?: { status?: string; legalArea?: string; processType?: string; responsibleLawyer?: string }) {
    const where: any = { userId };
    if (filters?.status) where.status = filters.status;
    if (filters?.legalArea) where.legalArea = filters.legalArea;
    if (filters?.processType) where.processType = filters.processType;
    if (filters?.responsibleLawyer) where.responsibleLawyer = filters.responsibleLawyer;

    const [data, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              caseFacts: true,
              caseEvents: true,
              caseAlerts: true,
              userDocuments: true,
              caseEvidence: true,
            },
          },
        },
      }),
      this.prisma.case.count({ where }),
    ]);

    return { data, total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / pagination.limit) };
  }

  async findOne(userId: string, caseId: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        caseFacts: { orderBy: { chronologicalOrder: 'asc' } },
        caseEvents: { orderBy: { eventDate: 'asc' } },
        casePersons: { orderBy: { createdAt: 'asc' } },
        caseEvidence: { orderBy: { createdAt: 'desc' } },
        caseLegalIssues: { orderBy: { createdAt: 'desc' } },
        casePretensions: true,
        caseDefenses: true,
        caseAlerts: { orderBy: { createdAt: 'desc' } },
        caseTasks: { orderBy: { createdAt: 'desc' } },
        caseHearings: { orderBy: { scheduledAt: 'asc' } },
        caseNorms: { orderBy: { createdAt: 'desc' } },
        userDocuments: { select: { id: true, fileName: true, documentCategory: true, createdAt: true, version: true, syncStatus: true, mimeType: true, fileSize: true } },
        caseJurisprudence: true,
        _count: {
          select: {
            caseFacts: true,
            caseEvents: true,
            caseAlerts: true,
            userDocuments: true,
            caseEvidence: true,
            casePersons: true,
            caseLegalIssues: true,
            caseHearings: true,
          },
        },
      },
    });
    if (!caseData) throw new NotFoundException('Caso no encontrado');
    if (caseData.userId !== userId) throw new ForbiddenException('No tienes acceso a este caso');
    return caseData;
  }

  async update(userId: string, caseId: string, dto: UpdateCaseDto) {
    const existing = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) throw new NotFoundException('Caso no encontrado');
    if (existing.userId !== userId) throw new ForbiddenException('No tienes acceso a este caso');

    return this.prisma.case.update({
      where: { id: caseId },
      data: {
        name: dto.name,
        description: dto.description,
        legalArea: dto.legalArea,
        subarea: dto.subarea,
        processType: dto.processType,
        client: dto.client,
        court: dto.court,
        fileNumber: dto.fileNumber,
        city: dto.city,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        responsibleLawyer: dto.responsibleLawyer,
        opposingParty: dto.opposingParty,
        pretensions: dto.pretensions,
        amount: dto.amount,
        priority: dto.priority,
        parties: dto.parties as any,
        legalProblemDescription: dto.legalProblemDescription,
        additionalInfo: dto.additionalInfo,
        status: dto.status,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async remove(userId: string, caseId: string) {
    const existing = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) throw new NotFoundException('Caso no encontrado');
    if (existing.userId !== userId) throw new ForbiddenException('No tienes acceso a este caso');
    return this.prisma.case.delete({ where: { id: caseId } });
  }

  async getSummary(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        _count: {
          select: {
            caseFacts: true,
            caseEvents: true,
            caseAlerts: true,
            userDocuments: true,
            caseEvidence: true,
            casePersons: true,
            caseLegalIssues: true,
            caseHearings: true,
            caseTasks: { where: { isCompleted: false } },
          },
        },
        caseAlerts: { where: { isAcknowledged: false }, orderBy: { createdAt: 'desc' }, take: 5 },
        caseTasks: { where: { isCompleted: false }, orderBy: { dueDate: 'asc' }, take: 5 },
        caseHearings: { where: { status: 'scheduled' }, orderBy: { scheduledAt: 'asc' }, take: 3 },
      },
    });
    return caseData;
  }

  async addFact(userId: string, caseId: string, fact: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseFact.create({
      data: {
        caseId,
        factType: fact.factType || 'user_reported',
        description: fact.description,
        eventDate: fact.eventDate ? new Date(fact.eventDate) : null,
        eventDateText: fact.eventDateText,
        isDateExact: fact.isDateExact ?? true,
        isJuridicallyRelevant: fact.isJuridicallyRelevant ?? false,
        relevanceExplanation: fact.relevanceExplanation,
        sourceType: fact.sourceType,
        sourceDocumentId: fact.sourceDocumentId,
        verificationStatus: fact.verificationStatus ?? 'unverified',
        metadata: fact.metadata as any || {},
      },
    });
  }

  async getFacts(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseFact.findMany({
      where: { caseId },
      orderBy: { chronologicalOrder: 'asc' },
      include: { factEntities: true },
    });
  }

  async updateFact(userId: string, caseId: string, factId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseFact.update({
      where: { id: factId },
      data: {
        description: data.description,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        eventDateText: data.eventDateText,
        isDateExact: data.isDateExact,
        isJuridicallyRelevant: data.isJuridicallyRelevant,
        relevanceExplanation: data.relevanceExplanation,
        verificationStatus: data.verificationStatus,
        metadata: data.metadata as any,
      },
    });
  }

  async deleteFact(userId: string, caseId: string, factId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseFact.delete({ where: { id: factId } });
  }

  async addEvent(userId: string, caseId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseEvent.create({
      data: {
        caseId,
        description: data.description,
        eventDate: new Date(data.eventDate),
        isDateExact: data.isDateExact ?? true,
        isJuridicallyRelevant: data.isJuridicallyRelevant ?? false,
        metadata: data.metadata as any || {},
      },
    });
  }

  async getTimeline(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseEvent.findMany({
      where: { caseId },
      orderBy: { eventDate: 'asc' },
    });
  }

  async updateEvent(userId: string, caseId: string, eventId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseEvent.update({
      where: { id: eventId },
      data: {
        description: data.description,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        isDateExact: data.isDateExact,
        isJuridicallyRelevant: data.isJuridicallyRelevant,
      },
    });
  }

  async deleteEvent(userId: string, caseId: string, eventId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseEvent.delete({ where: { id: eventId } });
  }

  async addPerson(userId: string, caseId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.casePerson.create({
      data: {
        caseId,
        personType: data.personType,
        fullName: data.fullName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        email: data.email,
        phone: data.phone,
        address: data.address,
        role: data.role,
        notes: data.notes,
      },
    });
  }

  async getPersons(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.casePerson.findMany({
      where: { caseId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updatePerson(userId: string, caseId: string, personId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.casePerson.update({
      where: { id: personId },
      data: {
        personType: data.personType,
        fullName: data.fullName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        email: data.email,
        phone: data.phone,
        address: data.address,
        role: data.role,
        notes: data.notes,
      },
    });
  }

  async deletePerson(userId: string, caseId: string, personId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.casePerson.delete({ where: { id: personId } });
  }

  async addEvidence(userId: string, caseId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseEvidence.create({
      data: {
        caseId,
        evidenceType: data.evidenceType,
        title: data.title,
        description: data.description,
        relatedFactIds: data.relatedFactIds || [],
        relatedPersonIds: data.relatedPersonIds || [],
        relatedDocumentIds: data.relatedDocumentIds || [],
        relatedLegalIssueIds: data.relatedLegalIssueIds || [],
        status: data.status || 'pending',
        notes: data.notes,
      },
    });
  }

  async getEvidence(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseEvidence.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateEvidence(userId: string, caseId: string, evidenceId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseEvidence.update({
      where: { id: evidenceId },
      data: {
        evidenceType: data.evidenceType,
        title: data.title,
        description: data.description,
        relatedFactIds: data.relatedFactIds,
        relatedPersonIds: data.relatedPersonIds,
        relatedDocumentIds: data.relatedDocumentIds,
        relatedLegalIssueIds: data.relatedLegalIssueIds,
        status: data.status,
        notes: data.notes,
      },
    });
  }

  async deleteEvidence(userId: string, caseId: string, evidenceId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseEvidence.delete({ where: { id: evidenceId } });
  }

  async addLegalIssue(userId: string, caseId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseLegalIssue.create({
      data: {
        caseId,
        issueType: data.issueType || 'secondary',
        title: data.title,
        legalQuestion: data.legalQuestion,
        description: data.description,
        partyPosition: data.partyPosition,
        opposingPosition: data.opposingPosition,
        relatedNorms: data.relatedNorms || [],
        relatedRulings: data.relatedRulings || [],
        isPrimary: data.isPrimary ?? false,
      },
    });
  }

  async getLegalIssues(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseLegalIssue.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLegalIssue(userId: string, caseId: string, issueId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseLegalIssue.update({
      where: { id: issueId },
      data: {
        issueType: data.issueType,
        title: data.title,
        legalQuestion: data.legalQuestion,
        description: data.description,
        partyPosition: data.partyPosition,
        opposingPosition: data.opposingPosition,
        relatedNorms: data.relatedNorms,
        relatedRulings: data.relatedRulings,
        isPrimary: data.isPrimary,
      },
    });
  }

  async deleteLegalIssue(userId: string, caseId: string, issueId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseLegalIssue.delete({ where: { id: issueId } });
  }

  async addHearing(userId: string, caseId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseHearing.create({
      data: {
        caseId,
        hearingType: data.hearingType,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        location: data.location,
        status: data.status || 'scheduled',
        notes: data.notes,
      },
    });
  }

  async getHearings(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseHearing.findMany({
      where: { caseId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async updateHearing(userId: string, caseId: string, hearingId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseHearing.update({
      where: { id: hearingId },
      data: {
        hearingType: data.hearingType,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        location: data.location,
        status: data.status,
        notes: data.notes,
      },
    });
  }

  async deleteHearing(userId: string, caseId: string, hearingId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseHearing.delete({ where: { id: hearingId } });
  }

  async addTask(userId: string, caseId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseTask.create({
      data: {
        caseId,
        description: data.description,
        taskType: data.taskType || 'action',
        priority: data.priority || 'medium',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdBy: data.createdBy || 'user',
      },
    });
  }

  async getTasks(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseTask.findMany({
      where: { caseId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async updateTask(userId: string, caseId: string, taskId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseTask.update({
      where: { id: taskId },
      data: {
        description: data.description,
        taskType: data.taskType,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        isCompleted: data.isCompleted,
      },
    });
  }

  async deleteTask(userId: string, caseId: string, taskId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseTask.delete({ where: { id: taskId } });
  }

  async addAlert(userId: string, caseId: string, alert: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseAlert.create({
      data: {
        caseId,
        alertType: alert.alertType,
        priority: alert.priority || 'medium',
        title: alert.title,
        description: alert.description,
        recommendation: alert.recommendation,
        relatedFactId: alert.relatedFactId,
      },
    });
  }

  async getAlerts(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseAlert.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAlert(userId: string, caseId: string, alertId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseAlert.update({
      where: { id: alertId },
      data: {
        isAcknowledged: data.isAcknowledged,
        acknowledgedAt: data.isAcknowledged ? new Date() : null,
      },
    });
  }

  async addNorm(userId: string, caseId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseNorm.create({
      data: {
        caseId,
        normType: data.normType,
        reference: data.reference,
        description: data.description,
        relevance: data.relevance,
      },
    });
  }

  async getNorms(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseNorm.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocuments(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.userDocument.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGeneratedDocuments(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.generatedDocument.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveJurisprudence(userId: string, caseId: string, data: any) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseJurisprudence.create({
      data: {
        caseId,
        rulingId: data.rulingId,
        similarityScore: data.similarityScore,
        relevanceNote: data.relevanceNote,
        analysisNotes: data.analysisNotes,
      },
    });
  }

  async getJurisprudence(userId: string, caseId: string) {
    await this.verifyAccess(userId, caseId);
    return this.prisma.caseJurisprudence.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async verifyAccess(userId: string, caseId: string) {
    const caseData = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) throw new NotFoundException('Caso no encontrado');
    if (caseData.userId !== userId) throw new ForbiddenException('No tienes acceso a este caso');
  }
}
