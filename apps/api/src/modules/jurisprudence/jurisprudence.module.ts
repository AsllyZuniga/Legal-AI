import { Module } from '@nestjs/common';
import { JurisprudenceService } from './jurisprudence.service';
import { JurisprudenceController } from './jurisprudence.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [JurisprudenceController],
  providers: [JurisprudenceService, PrismaService],
  exports: [JurisprudenceService],
})
export class JurisprudenceModule {}
