import { Test, TestingModule } from '@nestjs/testing';
import { AlertSeverity, AlertStatus } from '../common/enums';
import { matchMetricThreshold } from './alert-thresholds';
import { AlertsService } from './alerts.service';
import { AlertsRepository } from './repositories/alerts.repository';

describe('AlertsService', () => {
  let service: AlertsService;
  let repository: {
    create: jest.Mock;
    findActiveDuplicate: jest.Mock;
    countActive: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    updateById: jest.Mock;
  };

  const doc = {
    id: 'a1',
    title: 'Elevated latency',
    message: 'latency_ms=900 exceeds healthy threshold 400',
    severity: AlertSeverity.WARNING,
    status: AlertStatus.ACTIVE,
    serviceId: { toString: () => 's1' },
    incidentId: null,
    channel: 'in-app',
    triggeredAt: new Date('2026-08-19T08:00:00.000Z'),
    acknowledgedAt: null,
    createdAt: new Date('2026-08-19T08:00:00.000Z'),
    updatedAt: new Date('2026-08-19T08:00:00.000Z'),
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn().mockResolvedValue(doc),
      findActiveDuplicate: jest.fn().mockResolvedValue(null),
      countActive: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([doc]),
      count: jest.fn().mockResolvedValue(1),
      updateById: jest.fn().mockResolvedValue({
        ...doc,
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: AlertsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(AlertsService);
  });

  it('creates an alert when no duplicate exists', async () => {
    const alert = await service.create({
      title: 'Elevated latency',
      message: 'latency_ms=900 exceeds healthy threshold 400',
      serviceId: 's1',
    });

    expect(repository.create).toHaveBeenCalled();
    expect(alert.id).toBe('a1');
    expect(alert.serviceId).toBe('s1');
  });

  it('returns the existing active alert instead of duplicating', async () => {
    repository.findActiveDuplicate.mockResolvedValue(doc);

    const alert = await service.create({
      title: 'Elevated latency',
      message: 'again',
      serviceId: 's1',
    });

    expect(repository.create).not.toHaveBeenCalled();
    expect(alert.id).toBe('a1');
  });

  it('counts active alerts', async () => {
    await expect(service.countActive()).resolves.toBe(2);
  });
});

describe('matchMetricThreshold', () => {
  it('matches Isolation Forest RCA latency threshold', () => {
    expect(matchMetricThreshold('http_latency_ms', 900)?.title).toBe(
      'Elevated latency',
    );
  });

  it('does not match healthy CPU', () => {
    expect(matchMetricThreshold('cpu_pct', 35)).toBeNull();
  });
});
