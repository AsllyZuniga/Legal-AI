import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Crear conversación' })
  createConversation(@CurrentUser() user: any, @Body() body: { title?: string; caseId?: string; analysisMode?: string }) {
    return this.chatService.createConversation(user.sub, body);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Listar conversaciones' })
  getConversations(@CurrentUser() user: any) {
    return this.chatService.getConversations(user.sub);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Obtener mensajes de una conversación' })
  getMessages(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatService.getMessages(user.sub, id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Enviar mensaje' })
  sendMessage(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { content: string }) {
    return this.chatService.sendMessage(user.sub, id, body.content);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Eliminar conversación' })
  deleteConversation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatService.deleteConversation(user.sub, id);
  }
}
