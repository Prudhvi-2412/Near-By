import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AuthService', () => {
  let auth: AuthService;
  let prisma: { user: any; refreshToken: any };
  let users: { findByEmail: jest.Mock; findById: jest.Mock; createWithRole: jest.Mock };
  let jwt: JwtService;

  beforeEach(() => {
    prisma = {
      user: { update: jest.fn() },
      refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    };
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createWithRole: jest.fn(),
    };
    jwt = new JwtService({});
    const config = new ConfigService({
      JWT_ACCESS_SECRET: 'test_access_secret',
      JWT_ACCESS_TTL: '15m',
      JWT_REFRESH_SECRET: 'test_refresh_secret',
      JWT_REFRESH_TTL: '7d',
    });

    auth = new AuthService(prisma as unknown as PrismaService, users as unknown as UsersService, jwt, config);
  });

  describe('register', () => {
    it('rejects a duplicate email', async () => {
      users.findByEmail.mockResolvedValue({ id: 'existing-user' });
      await expect(
        auth.register({ email: 'taken@example.com', password: 'Password1', role: 'CUSTOMER' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes the password and issues a token pair for a new user', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.createWithRole.mockResolvedValue({
        id: 'user-1',
        email: 'new@example.com',
        roles: [{ role: { name: 'CUSTOMER' } }],
      });

      const result = await auth.register({ email: 'new@example.com', password: 'Password1', role: 'CUSTOMER' } as any);

      expect(users.createWithRole).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', role: 'CUSTOMER' }),
      );
      const createdPasswordHash = users.createWithRole.mock.calls[0][0].passwordHash;
      expect(await bcrypt.compare('Password1', createdPasswordHash)).toBe(true);
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(auth.login('nobody@example.com', 'whatever')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      users.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        status: 'ACTIVE',
        passwordHash: await bcrypt.hash('correct-password', 10),
        roles: [{ role: { name: 'CUSTOMER' } }],
      });
      await expect(auth.login('user@example.com', 'wrong-password')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a suspended account even with the correct password', async () => {
      users.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        status: 'SUSPENDED',
        passwordHash: await bcrypt.hash('correct-password', 10),
        roles: [{ role: { name: 'CUSTOMER' } }],
      });
      await expect(auth.login('user@example.com', 'correct-password')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues tokens for a correct login', async () => {
      users.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        status: 'ACTIVE',
        passwordHash: await bcrypt.hash('correct-password', 10),
        roles: [{ role: { name: 'CUSTOMER' } }],
      });
      const result = await auth.login('user@example.com', 'correct-password');
      expect(result.accessToken).toEqual(expect.any(String));
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
    });
  });

  describe('refresh', () => {
    it('rejects a refresh token that does not match the stored hash (reuse/theft detection)', async () => {
      const { refreshToken } = await (async () => {
        users.findByEmail.mockResolvedValue(null);
        users.createWithRole.mockResolvedValue({ id: 'user-1', email: 'a@b.com', roles: [{ role: { name: 'CUSTOMER' } }] });
        return auth.register({ email: 'a@b.com', password: 'Password1', role: 'CUSTOMER' } as any);
      })();

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'some-jti',
        userId: 'user-1',
        tokenHash: 'a-completely-different-hash',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(auth.refresh(refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an already-revoked refresh token', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.createWithRole.mockResolvedValue({ id: 'user-1', email: 'a@b.com', roles: [{ role: { name: 'CUSTOMER' } }] });
      const { refreshToken } = await auth.register({ email: 'a@b.com', password: 'Password1', role: 'CUSTOMER' } as any);

      const createdData = prisma.refreshToken.create.mock.calls[0][0].data;
      prisma.refreshToken.findUnique.mockResolvedValue({ ...createdData, revokedAt: new Date() });

      await expect(auth.refresh(refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rotates a valid refresh token: revokes the old one and issues a new pair', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.createWithRole.mockResolvedValue({ id: 'user-1', email: 'a@b.com', roles: [{ role: { name: 'CUSTOMER' } }] });
      const { refreshToken } = await auth.register({ email: 'a@b.com', password: 'Password1', role: 'CUSTOMER' } as any);

      const createdData = prisma.refreshToken.create.mock.calls[0][0].data;
      prisma.refreshToken.findUnique.mockResolvedValue({ ...createdData, revokedAt: null });
      users.findById.mockResolvedValue({ id: 'user-1', status: 'ACTIVE', roles: [{ role: { name: 'CUSTOMER' } }] });

      const result = await auth.refresh(refreshToken);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: createdData.id },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).not.toEqual(refreshToken);
    });
  });
});
