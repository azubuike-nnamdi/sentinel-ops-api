import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../common/enums';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const repository = {
    existsByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    updateById: jest.fn(),
    softDeactivate: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue(4),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('creates a user when email is unique', async () => {
    repository.existsByEmail.mockResolvedValue(false);
    repository.create.mockResolvedValue({
      id: 'u1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@sentinelops.io',
      role: UserRole.ADMIN,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const user = await service.create({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@sentinelops.io',
      password: 'Str0ngP@ssw0rd!',
      role: UserRole.ADMIN,
    });

    expect(user.email).toBe('ada@sentinelops.io');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: expect.not.stringMatching('Str0ngP@ssw0rd!'),
      }),
    );
  });

  it('rejects duplicate emails', async () => {
    repository.existsByEmail.mockResolvedValue(true);

    await expect(
      service.create({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@sentinelops.io',
        password: 'Str0ngP@ssw0rd!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when user is missing', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
