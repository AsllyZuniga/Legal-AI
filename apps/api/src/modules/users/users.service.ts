import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, documentNumber: true, fullName: true, lawFirm: true,
        phone: true, roleId: true, credits: true, isActive: true, createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, data: { fullName?: string; lawFirm?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        lawFirm: data.lawFirm,
        phone: data.phone,
        updatedAt: new Date(),
      },
      select: {
        id: true, documentNumber: true, fullName: true, lawFirm: true, phone: true, roleId: true,
      },
    });
  }

  async decrementCredits(userId: string, amount: number = 1) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: 0 } },
    });
  }
}
