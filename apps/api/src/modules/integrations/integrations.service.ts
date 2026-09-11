import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async getConnection(userId: string, provider: string) {
    const connection = await this.prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    return connection;
  }

  async getConnections(userId: string) {
    return this.prisma.integrationConnection.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        accountEmail: true,
        accountName: true,
        isActive: true,
        scope: true,
        createdAt: true,
      },
    });
  }

  async saveConnection(userId: string, data: { provider: string; accessToken: string; refreshToken?: string; tokenExpiresAt?: Date; scope?: string; accountEmail?: string; accountName?: string }) {
    return this.prisma.integrationConnection.upsert({
      where: { userId_provider: { userId, provider: data.provider } },
      create: {
        userId,
        provider: data.provider,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        scope: data.scope,
        accountEmail: data.accountEmail,
        accountName: data.accountName,
      },
      update: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        scope: data.scope,
        accountEmail: data.accountEmail,
        accountName: data.accountName,
        isActive: true,
      },
    });
  }

  async disconnect(userId: string, provider: string) {
    const connection = await this.prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    if (!connection) throw new NotFoundException('Conexion no encontrada');
    return this.prisma.integrationConnection.update({
      where: { userId_provider: { userId, provider } },
      data: { isActive: false, accessToken: null, refreshToken: null },
    });
  }

  async getAuthUrl(provider: string): Promise<{ url: string }> {
    const urls: Record<string, string> = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID || ''}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || '')}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly&access_type=offline`,
      microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.MICROSOFT_CLIENT_ID || ''}&redirect_uri=${encodeURIComponent(process.env.MICROSOFT_REDIRECT_URI || '')}&response_type=code&scope=Files.ReadWrite.All+User.Read+offline_access`,
    };
    return { url: urls[provider] || '' };
  }
}
