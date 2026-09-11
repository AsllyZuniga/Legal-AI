import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GenerationService } from './generation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Generation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('generation')
export class GenerationController {
  constructor(private generationService: GenerationService) {}

  @Post('document')
  @ApiOperation({ summary: 'Generar documento jurídico' })
  generate(@CurrentUser() user: any, @Body() body: { caseId: string; documentType: string; specificInstructions?: string }) {
    return this.generationService.generateDocument(user.sub, body);
  }

  @Get('document/:id')
  @ApiOperation({ summary: 'Obtener documento generado' })
  getDocument(@CurrentUser() user: any, @Param('id') id: string) {
    return this.generationService.getDocument(user.sub, id);
  }

  @Get('case/:caseId')
  @ApiOperation({ summary: 'Documentos generados de un caso' })
  getDocumentsByCase(@CurrentUser() user: any, @Param('caseId') caseId: string) {
    return this.generationService.getDocumentsByCase(user.sub, caseId);
  }
}
