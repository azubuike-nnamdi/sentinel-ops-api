import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../common/enums';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    create: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    recordLogin: jest.fn(),
    toUser: jest.fn(),
    findById: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.expiresIn') return '1d';
      if (key === 'jwt.refreshExpiresIn') return '7d';
      return undefined;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'jwt.refreshSecret') return 'refresh-secret';
      throw new Error(`Missing ${key}`);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates a user and returns tokens', async () => {
      const user = {
        id: 'u1',
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@sentinelops.io',
        role: UserRole.OPS,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.create.mockResolvedValue(user);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.register({
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@sentinelops.io',
        password: 'Str0ngP@ssw0rd!',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.OPS }),
      );
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.user.email).toBe('grace@sentinelops.io');
    });
  });

  describe('login', () => {
    it('rejects invalid credentials', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'missing@sentinelops.io',
          password: 'wrong',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns tokens for a valid password', async () => {
      const bcrypt = await import('../common/utils/password.util');
      const hash = await bcrypt.PasswordUtil.hash('Str0ngP@ssw0rd!', 4);

      const document = {
        id: 'u1',
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@sentinelops.io',
        role: UserRole.OPS,
        isActive: true,
        password: hash,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const profile = { ...document, password: undefined };

      usersService.findByEmailWithPassword.mockResolvedValue(document);
      usersService.toUser.mockReturnValue(profile);
      usersService.recordLogin.mockResolvedValue(undefined);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        email: 'grace@sentinelops.io',
        password: 'Str0ngP@ssw0rd!',
      });

      expect(result.tokens.accessToken).toBe('access-token');
      expect(usersService.recordLogin).toHaveBeenCalledWith('u1');
    });
  });
});
