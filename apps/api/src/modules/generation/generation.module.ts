import { Module } from '@nestjs/common';
import { GenerationService } from './generation.service';
import { GenerationController } from './generation.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [GenerationController],
  providers: [GenerationService, PrismaService],
  exports: [GenerationService],
})
export class GenerationModule {}
