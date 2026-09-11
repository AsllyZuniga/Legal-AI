import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../prisma.service';
import { MinioService } from '../../common/services/minio.service';

@Injectable()
export class GoogleDriveService {
  private oauth2Client;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });
  }

  async exchangeCode(userId: string, code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const existing = await this.prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider: 'google' } },
    });

    const connection = await this.prisma.integrationConnection.upsert({
      where: { userId_provider: { userId, provider: 'google' } },
      create: {
        userId,
        provider: 'google',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || null,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || '',
        accountEmail: userInfo.email || null,
        accountName: userInfo.name || null,
        isActive: true,
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || existing?.refreshToken || null,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || '',
        accountEmail: userInfo.email || null,
        accountName: userInfo.name || null,
        isActive: true,
      },
    });

    return connection;
  }

  private async getAuthenticatedClient(userId: string) {
    const connection = await this.prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider: 'google' } },
    });

    if (!connection || !connection.isActive) {
      throw new BadRequestException('No hay conexion con Google Drive. Conecta tu cuenta primero.');
    }

    this.oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
    });

    if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date()) {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      await this.prisma.integrationConnection.update({
        where: { userId_provider: { userId, provider: 'google' } },
        data: {
          accessToken: credentials.access_token!,
          tokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        },
      });
      this.oauth2Client.setCredentials(credentials);
    }

    return this.oauth2Client;
  }

  async uploadToDrive(userId: string, fileBuffer: Buffer, fileName: string, mimeType: string): Promise<{ driveFileId: string; webViewLink: string }> {
    const auth = await this.getAuthenticatedClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx');

    const res = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: isDocx ? 'application/vnd.google-apps.document' : mimeType,
      },
      media: {
        mimeType: isDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : mimeType,
        body: require('stream').Readable.from(fileBuffer),
      },
      fields: 'id,webViewLink',
    });

    return {
      driveFileId: res.data.id!,
      webViewLink: res.data.webViewLink || `https://docs.google.com/document/d/${res.data.id}/edit`,
    };
  }

  async downloadFromDrive(userId: string, driveFileId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const auth = await this.getAuthenticatedClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    const fileMeta = await drive.files.get({ fileId: driveFileId, fields: 'mimeType,name' });
    const driveMimeType = fileMeta.data.mimeType || '';

    let exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (driveMimeType === 'application/vnd.google-apps.document') {
      const res = await drive.files.export(
        { fileId: driveFileId, mimeType: exportMime },
        { responseType: 'arraybuffer' },
      );
      return { buffer: Buffer.from(res.data as ArrayBuffer), mimeType: exportMime };
    } else {
      const res = await drive.files.get(
        { fileId: driveFileId, alt: 'media' },
        { responseType: 'arraybuffer' },
      );
      return { buffer: Buffer.from(res.data as ArrayBuffer), mimeType: driveMimeType };
    }
  }

  async getEditUrl(userId: string, driveFileId: string): Promise<string> {
    const auth = await this.getAuthenticatedClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.get({ fileId: driveFileId, fields: 'webViewLink,mimeType' });
    return res.data.webViewLink || `https://docs.google.com/document/d/${driveFileId}/edit`;
  }
}
