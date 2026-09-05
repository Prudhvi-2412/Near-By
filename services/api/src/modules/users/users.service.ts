import { Injectable } from '@nestjs/common';
import type { RoleName } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }

  async createWithRole(params: { email: string; phone?: string; passwordHash: string; role: RoleName }) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: params.role } });
    return this.prisma.user.create({
      data: {
        email: params.email,
        phone: params.phone || undefined,
        passwordHash: params.passwordHash,
        roles: { create: [{ roleId: role.id }] },
      },
      include: { roles: { include: { role: true } } },
    });
  }

  static roleNames(user: { roles: { role: { name: RoleName } }[] }): RoleName[] {
    return user.roles.map((r) => r.role.name);
  }
}
