import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { GoogleDriveService } from './google-drive.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private service: IntegrationsService,
    private googleDriveService: GoogleDriveService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar conexiones activas' })
  getConnections(@CurrentUser() user: any) {
    return this.service.getConnections(user.sub);
  }

  @Get('google/auth-url')
  @ApiOperation({ summary: 'Obtener URL de autenticacion Google Drive' })
  getGoogleAuthUrl() {
    return { url: this.googleDriveService.getAuthUrl() };
  }

  @Post('google/callback')
  @ApiOperation({ summary: 'Callback OAuth Google - intercambiar codigo por tokens' })
  async handleGoogleCallback(@CurrentUser() user: any, @Body() body: { code: string }) {
    return this.googleDriveService.exchangeCode(user.sub, body.code);
  }

  @Get(':provider/auth-url')
  @ApiOperation({ summary: 'Obtener URL de autenticacion OAuth' })
  getAuthUrl(@Param('provider') provider: string) {
    return this.service.getAuthUrl(provider);
  }

  @Get(':provider')
  @ApiOperation({ summary: 'Obtener estado de conexion' })
  getConnection(@CurrentUser() user: any, @Param('provider') provider: string) {
    return this.service.getConnection(user.sub, provider);
  }

  @Post(':provider/callback')
  @ApiOperation({ summary: 'Callback OAuth' })
  handleCallback(@CurrentUser() user: any, @Param('provider') provider: string, @Body() body: any) {
    return this.service.saveConnection(user.sub, { provider, ...body });
  }

  @Delete(':provider')
  @ApiOperation({ summary: 'Desconectar integracion' })
  disconnect(@CurrentUser() user: any, @Param('provider') provider: string) {
    return this.service.disconnect(user.sub, provider);
  }
}
