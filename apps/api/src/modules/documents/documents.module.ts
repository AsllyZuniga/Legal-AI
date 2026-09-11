import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaService } from '../../prisma.service';
import { MinioService } from '../../common/services/minio.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService, MinioService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
