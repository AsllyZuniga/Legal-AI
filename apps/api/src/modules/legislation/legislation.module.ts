import { Module } from '@nestjs/common';
import { LegislationService } from './legislation.service';
import { LegislationController } from './legislation.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [LegislationController],
  providers: [LegislationService, PrismaService],
  exports: [LegislationService],
})
export class LegislationModule {}
