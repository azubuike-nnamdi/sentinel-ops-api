import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from '../alerts/alerts.service';
import { AnomaliesService } from '../anomalies/anomalies.service';
import { DependenciesService } from '../dependencies/dependencies.service';
import { IncidentsService } from '../incidents/incidents.service';
import { LogsService } from '../logs/logs.service';
import { MetricsService } from '../metrics/metrics.service';
import { ServicesService } from '../services/services.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: ServicesService,
          useValue: {
            countAll: jest.fn().mockResolvedValue(4),
            countByStatus: jest.fn().mockResolvedValue({
              healthy: 2,
              degraded: 1,
              unhealthy: 1,
            }),
          },
        },
        {
          provide: IncidentsService,
          useValue: {
            countOpen: jest.fn().mockResolvedValue(3),
            findAll: jest.fn().mockResolvedValue({
              items: [
                {
                  id: 'i1',
                  title: 'Checkout failures',
                  severity: 'high',
                  status: 'open',
                  createdAt: new Date('2026-08-01T00:00:00.000Z'),
                },
              ],
            }),
          },
        },
        {
          provide: AnomaliesService,
          useValue: { countOpen: jest.fn().mockResolvedValue(2) },
        },
        {
          provide: AlertsService,
          useValue: {
            countActive: jest.fn().mockResolvedValue(1),
            findRecent: jest.fn().mockResolvedValue([
              {
                id: 'a1',
                title: 'Elevated latency',
                severity: 'warning',
                status: 'active',
                serviceId: 's1',
                triggeredAt: new Date('2026-08-19T08:00:00.000Z'),
              },
            ]),
          },
        },
        {
          provide: LogsService,
          useValue: { countSince: jest.fn().mockResolvedValue(40) },
        },
        {
          provide: MetricsService,
          useValue: { countSince: jest.fn().mockResolvedValue(15) },
        },
        {
          provide: DependenciesService,
          useValue: { countAll: jest.fn().mockResolvedValue(6) },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('aggregates live counts and recent incidents', async () => {
    const summary = await service.getSummary();
    expect(summary.services.total).toBe(4);
    expect(summary.services.byStatus.healthy).toBe(2);
    expect(summary.incidents.open).toBe(3);
    expect(summary.incidents.recent[0].title).toBe('Checkout failures');
    expect(summary.anomalies.open).toBe(2);
    expect(summary.alerts.active).toBe(1);
    expect(summary.alerts.recent[0].title).toBe('Elevated latency');
    expect(summary.logs.last24h).toBe(40);
    expect(summary.metrics.last24h).toBe(15);
    expect(summary.dependencies.total).toBe(6);
    expect(summary.generatedAt).toBeDefined();
  });
});
