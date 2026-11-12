import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TokenCryptoService } from '../../common/services/token-crypto.service';

const SAFE_FIELDS = {
  id: true,
  provider: true,
  accountEmail: true,
  accountName: true,
  isActive: true,
  scope: true,
  tokenExpiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private crypto: TokenCryptoService,
  ) {}

  async getConnection(userId: string, provider: string) {
    return this.prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider } },
      select: SAFE_FIELDS,
    });
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
    const accessToken = this.crypto.encrypt(data.accessToken);
    const refreshToken = this.crypto.encrypt(data.refreshToken);

    return this.prisma.integrationConnection.upsert({
      where: { userId_provider: { userId, provider: data.provider } },
      create: {
        userId,
        provider: data.provider,
        accessToken,
        refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        scope: data.scope,
        accountEmail: data.accountEmail,
        accountName: data.accountName,
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        scope: data.scope,
        accountEmail: data.accountEmail,
        accountName: data.accountName,
        isActive: true,
      },
      select: SAFE_FIELDS,
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
      select: SAFE_FIELDS,
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
