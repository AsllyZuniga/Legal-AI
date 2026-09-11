import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { documentNumber: dto.documentNumber } });
    if (existing) throw new ConflictException('El número de cédula ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        documentNumber: dto.documentNumber,
        passwordHash: passwordHash,
        fullName: dto.fullName,
        lawFirm: dto.lawFirm,
        phone: dto.phone,
        roleId: 'lawyer',
        credits: 1000,
      },
      select: { id: true, documentNumber: true, fullName: true, roleId: true, createdAt: true },
    });

    const tokens = await this.generateTokens(user.id, user.documentNumber, user.roleId);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { documentNumber: dto.documentNumber } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    if (!user.isActive) throw new UnauthorizedException('Cuenta desactivada');

    const tokens = await this.generateTokens(user.id, user.documentNumber, user.roleId);
    return {
      user: { id: user.id, documentNumber: user.documentNumber, fullName: user.fullName, role: user.roleId },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new UnauthorizedException();
      return this.generateTokens(user.id, user.documentNumber, user.roleId);
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, documentNumber: true, fullName: true, lawFirm: true,
        phone: true, roleId: true, credits: true, createdAt: true,
      },
    });
  }

  private async generateTokens(userId: string, documentNumber: string, role: string) {
    const payload = { sub: userId, documentNumber, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);
    return { accessToken, refreshToken };
  }
}
