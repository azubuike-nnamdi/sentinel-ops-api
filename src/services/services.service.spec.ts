import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ServiceStatus } from '../common/enums';
import { ServicesRepository } from './repositories/services.repository';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;

  const repository = {
    findBySlug: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: ServicesRepository, useValue: repository },
      ],
    }).compile();
    service = module.get(ServicesService);
  });

  it('creates a service', async () => {
    repository.findBySlug.mockResolvedValue(null);
    repository.create.mockResolvedValue({
      id: 's1',
      name: 'Payment Gateway',
      slug: 'payment-gateway',
      description: '',
      owner: 'payments',
      environment: 'production',
      status: ServiceStatus.HEALTHY,
      endpoints: [],
      tags: [],
      metadata: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      name: 'Payment Gateway',
      slug: 'payment-gateway',
      owner: 'payments',
      environment: 'production',
    });

    expect(result.slug).toBe('payment-gateway');
  });

  it('rejects duplicate slugs', async () => {
    repository.findBySlug.mockResolvedValue({ id: 'existing' });
    await expect(
      service.create({
        name: 'Payment Gateway',
        slug: 'payment-gateway',
        owner: 'payments',
        environment: 'production',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
