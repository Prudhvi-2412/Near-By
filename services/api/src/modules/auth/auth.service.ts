import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import type { RegisterDto } from './dto/register.dto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.createWithRole({
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
    });
    return this.issueTokens(user.id, user.email, UsersService.roleNames(user));
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.issueTokens(user.id, user.email, UsersService.roleNames(user));
  }

  async refresh(rawRefreshToken: string) {
    let payload: { sub: string; jti: string };
    try {
      payload = this.jwt.verify(rawRefreshToken, { secret: this.config.get<string>('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.tokenHash !== hashToken(rawRefreshToken)) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const user = await this.users.findById(stored.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }
    return this.issueTokens(user.id, user.email, UsersService.roleNames(user));
  }

  async logout(rawRefreshToken: string) {
    try {
      const payload = this.jwt.verify<{ jti: string }>(rawRefreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Already invalid/expired — logout is idempotent either way.
    }
  }

  private async issueTokens(userId: string, email: string, roles: string[]) {
    const accessToken = this.jwt.sign(
      { sub: userId, email, roles },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL'),
      },
    );

    const jti = randomUUID();
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL')!;
    const refreshToken = this.jwt.sign(
      { sub: userId, jti },
      { secret: this.config.get<string>('JWT_REFRESH_SECRET'), expiresIn: refreshTtl },
    );

    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return { accessToken, refreshToken, roles };
  }
}
