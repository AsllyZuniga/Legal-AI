import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  getMe(@CurrentUser() user: any) {
    return this.usersService.findOne(user.sub);
  }

  @Put('me')
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  updateMe(@CurrentUser() user: any, @Body() body: { fullName?: string; lawFirm?: string; phone?: string }) {
    return this.usersService.update(user.sub, body);
  }
}
