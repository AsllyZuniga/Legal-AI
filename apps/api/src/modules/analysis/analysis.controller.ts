import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analysis')
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  @Post('case/:caseId')
  @ApiOperation({ summary: 'Analizar caso completo (14 secciones)' })
  analyzeCase(@CurrentUser() user: any, @Param('caseId') caseId: string) {
    return this.analysisService.analyzeCase(user.sub, caseId);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Obtener resultado de análisis' })
  getAnalysis(@Param('sessionId') sessionId: string) {
    return this.analysisService.getAnalysis(sessionId);
  }

  @Post('compare/:rulingId')
  @ApiOperation({ summary: 'Comparar precedente con caso' })
  compare(
    @CurrentUser() user: any,
    @Param('rulingId') rulingId: string,
    @Body() body: { caseId?: string },
  ) {
    return this.analysisService.comparePrecedents(user.sub, rulingId, body.caseId);
  }

  @Post('evolution')
  @ApiOperation({ summary: 'Analizar evolución jurisprudencial' })
  analyzeEvolution(@Body() body: { legalTopic: string; corporation: string }) {
    return this.analysisService.analyzeEvolution(body.legalTopic, body.corporation);
  }
}
