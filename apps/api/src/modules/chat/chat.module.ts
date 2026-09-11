import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from '../../prisma.service';
import { JurisprudenceModule } from '../jurisprudence/jurisprudence.module';

@Module({
  imports: [JurisprudenceModule],
  controllers: [ChatController],
  providers: [ChatService, PrismaService],
  exports: [ChatService],
})
export class ChatModule {}
