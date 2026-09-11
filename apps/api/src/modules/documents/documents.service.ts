import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MinioService } from '../../common/services/minio.service';
import { GoogleDriveService } from '../integrations/google-drive.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
    private googleDriveService: GoogleDriveService,
  ) {}

  async create(
    userId: string,
    dto: {
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
      caseId?: string;
      documentCategory?: string;
    },
  ) {
    return this.prisma.userDocument.create({
      data: {
        userId,
        caseId: dto.caseId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        documentCategory: dto.documentCategory,
        extractionMethod: dto.mimeType?.includes('pdf') ? 'native_pdf' : 'docx_parser',
      },
    });
  }

  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    body: { caseId?: string; documentCategory?: string },
  ) {
    const { fileUrl, objectName } = await this.minioService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const doc = await this.prisma.userDocument.create({
      data: {
        userId,
        caseId: body.caseId,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        documentCategory: body.documentCategory,
        extractionMethod: file.mimetype?.includes('pdf') ? 'native_pdf' : 'docx_parser',
      },
    });

    return {
      ...doc,
      objectName,
    };
  }

  async findAll(userId: string, caseId?: string) {
    const where: any = { userId };
    if (caseId) where.caseId = caseId;
    return this.prisma.userDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        documentCategory: true,
        caseId: true,
        embeddingStatus: true,
        createdAt: true,
      },
    });
  }

  async findOne(userId: string, documentId: string) {
    const doc = await this.prisma.userDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    if (doc.userId !== userId) throw new ForbiddenException('No tienes acceso a este documento');
    return doc;
  }

  async remove(userId: string, documentId: string) {
    const doc = await this.prisma.userDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    if (doc.userId !== userId) throw new ForbiddenException('No tienes acceso a este documento');
    return this.prisma.userDocument.delete({ where: { id: documentId } });
  }

  async openInGoogleDocs(userId: string, documentId: string) {
    const doc = await this.prisma.userDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    if (doc.userId !== userId) throw new ForbiddenException('No tienes acceso a este documento');

    if (doc.externalId) {
      const editUrl = await this.googleDriveService.getEditUrl(userId, doc.externalId);
      return { editUrl, driveFileId: doc.externalId };
    }

    const objectName = this.extractObjectName(doc.fileUrl);
    const fileBuffer = await this.minioService.getFileBuffer(objectName);

    const { driveFileId, webViewLink } = await this.googleDriveService.uploadToDrive(
      userId,
      fileBuffer,
      doc.fileName,
      doc.mimeType || 'application/octet-stream',
    );

    await this.prisma.userDocument.update({
      where: { id: documentId },
      data: {
        externalId: driveFileId,
        externalUrl: webViewLink,
        syncStatus: 'google_drive',
        syncSource: 'google_drive',
      },
    });

    return { editUrl: webViewLink, driveFileId };
  }

  async syncFromGoogle(userId: string, documentId: string) {
    const doc = await this.prisma.userDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    if (doc.userId !== userId) throw new ForbiddenException('No tienes acceso a este documento');
    if (!doc.externalId) throw new ForbiddenException('Este documento no esta vinculado a Google Drive');

    const { buffer, mimeType } = await this.googleDriveService.downloadFromDrive(userId, doc.externalId);

    const objectName = `${Date.now()}-${doc.fileName.replace(/\s+/g, '_')}`;
    await this.minioService.uploadFile(buffer, doc.fileName, mimeType);

    const fileUrl = `http://localhost:9000/legal-documents/${objectName}`;

    await this.prisma.userDocument.update({
      where: { id: documentId },
      data: {
        fileUrl,
        fileSize: buffer.length,
        mimeType,
        version: { increment: 1 },
        lastModifiedAt: new Date(),
        syncStatus: 'synced',
      },
    });

    return { message: 'Documento sincronizado correctamente', version: (doc.version || 1) + 1 };
  }

  private extractObjectName(fileUrl: string): string {
    const url = new URL(fileUrl);
    const parts = url.pathname.split('/');
    return parts.slice(2).join('/');
  }
}
