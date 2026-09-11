import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GoogleDriveService } from './google-drive.service';
import { PrismaService } from '../../prisma.service';
import { MinioService } from '../../common/services/minio.service';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, GoogleDriveService, PrismaService, MinioService],
  exports: [IntegrationsService, GoogleDriveService],
})
export class IntegrationsModule {}
