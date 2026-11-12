import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GoogleDriveService } from './google-drive.service';
import { PrismaService } from '../../prisma.service';
import { MinioService } from '../../common/services/minio.service';
import { TokenCryptoService } from '../../common/services/token-crypto.service';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, GoogleDriveService, PrismaService, MinioService, TokenCryptoService],
  exports: [IntegrationsService, GoogleDriveService],
})
export class IntegrationsModule {}
