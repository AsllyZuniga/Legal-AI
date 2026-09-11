import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LegislationService } from './legislation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Legislation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('legislation')
export class LegislationController {
  constructor(private legislationService: LegislationService) {}

  @Get('search')
  @ApiOperation({ summary: 'Buscar normativa' })
  search(@Query('q') query?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.legislationService.search(query, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener norma por ID' })
  findOne(@Param('id') id: string) {
    return this.legislationService.findOne(id);
  }
}
