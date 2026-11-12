import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const PREFIX = 'enc:v1:';

@Injectable()
export class TokenCryptoService {
  private readonly logger = new Logger(TokenCryptoService.name);
  private readonly key: Buffer | null;

  constructor(private configService: ConfigService) {
    const raw = (this.configService.get<string>('TOKEN_ENCRYPTION_KEY', '') || '').trim();
    if (!raw) {
      this.logger.warn(
        'TOKEN_ENCRYPTION_KEY no definida: los tokens de integraciones se guardaran SIN cifrar.',
      );
      this.key = null;
      return;
    }

    let buf = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
    if (buf.length !== 32) {
      throw new InternalServerErrorException(
        'TOKEN_ENCRYPTION_KEY debe ser de 32 bytes (hex de 64 caracteres o base64).',
      );
    }
    this.key = buf;
  }

  encrypt(plain?: string | null): string | null {
    if (plain === undefined || plain === null) return null;
    if (!this.key || plain.startsWith(PREFIX)) return plain;

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
  }

  decrypt(stored?: string | null): string | null {
    if (stored === undefined || stored === null) return null;
    if (!stored.startsWith(PREFIX)) return stored;
    if (!this.key) {
      throw new InternalServerErrorException(
        'TOKEN_ENCRYPTION_KEY requerida para descifrar tokens existentes.',
      );
    }

    const data = Buffer.from(stored.slice(PREFIX.length), 'base64');
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const enc = data.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  }
}
