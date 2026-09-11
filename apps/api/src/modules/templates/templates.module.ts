import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { PrismaService } from '../../prisma.service';
import { MinioService } from '../../common/services/minio.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, PrismaService, MinioService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
