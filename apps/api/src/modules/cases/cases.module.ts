import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [CasesController],
  providers: [CasesService, PrismaService],
  exports: [CasesService],
})
export class CasesModule {}
