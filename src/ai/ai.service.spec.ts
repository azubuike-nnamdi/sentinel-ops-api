import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { AlertsService } from '../alerts/alerts.service';
import { AnomaliesService } from '../anomalies/anomalies.service';
import { DependenciesService } from '../dependencies/dependencies.service';
import { LogsService } from '../logs/logs.service';
import { MetricsService } from '../metrics/metrics.service';
import { ServicesService } from '../services/services.service';
import { ServiceStatus } from '../common/enums';
import { AiService } from './ai.service';
import { PredictionsRepository } from './repositories/predictions.repository';

describe('AiService', () => {
  let service: AiService;
  let httpService: { post: jest.Mock };
  let predictionsRepository: { create: jest.Mock };
  let alertsService: { createSafely: jest.Mock };
  let servicesService: { findById: jest.Mock };
  let dependenciesService: { findByServiceId: jest.Mock };
  let metricsService: { findByServiceId: jest.Mock };

  const userId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    httpService = {
      post: jest.fn().mockReturnValue(
        of({
          data: {
            service_id: 's1',
            symptom: 'Checkout is slow',
            is_anomaly: true,
            anomaly_score: 0.91,
            predictions: [
              {
                type: 'anomaly',
                confidence: 0.9,
                summary: 'Latency spike',
                evidence_id: 'a1',
                metric_name: 'latency',
              },
            ],
            model: {
              name: 'sentinelops-isolation-forest-v1',
              mode: 'isolation-forest',
            },
            generated_at: '2026-07-23T12:00:00.000Z',
          },
        }),
      ),
    };

    predictionsRepository = {
      create: jest.fn().mockResolvedValue({
        id: 'pred1',
      }),
    };

    alertsService = { createSafely: jest.fn().mockResolvedValue(null) };
    servicesService = {
      findById: jest.fn().mockResolvedValue({
        id: 's1',
        name: 'Payment Gateway',
        status: ServiceStatus.DEGRADED,
      }),
    };
    dependenciesService = {
      findByServiceId: jest.fn().mockResolvedValue([]),
    };
    metricsService = {
      findByServiceId: jest.fn().mockResolvedValue([
        {
          serviceId: 's1',
          name: 'latency_ms',
          value: 900,
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: HttpService, useValue: httpService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ai.serviceUrl') return 'http://localhost:8001';
              if (key === 'ai.timeoutMs') return 5000;
              if (key === 'ai.fallbackEnabled') return true;
              return undefined;
            }),
          },
        },
        {
          provide: ServicesService,
          useValue: servicesService,
        },
        {
          provide: AnomaliesService,
          useValue: {
            findByServiceId: jest.fn().mockResolvedValue([
              {
                id: 'a1',
                serviceId: 's1',
                metricName: 'latency',
                score: 0.9,
                description: 'Latency spike',
              },
            ]),
          },
        },
        {
          provide: DependenciesService,
          useValue: dependenciesService,
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
        {
          provide: LogsService,
          useValue: {
            countErrorLogsByServiceId: jest.fn().mockResolvedValue(12),
          },
        },
        {
          provide: PredictionsRepository,
          useValue: predictionsRepository,
        },
        {
          provide: AlertsService,
          useValue: alertsService,
        },
      ],
    }).compile();

    service = module.get(AiService);
  });

  it('returns Isolation Forest predictions from AI service', async () => {
    const result = await service.predict(
      {
        serviceId: 's1',
        symptom: 'Checkout is slow',
      },
      userId,
    );

    expect(httpService.post).toHaveBeenCalled();
    expect(predictionsRepository.create).toHaveBeenCalled();
    expect(result.predictions.length).toBeGreaterThan(0);
    expect(result.predictions[0].confidence).toBe(0.9);
    expect(result.model.name).toContain('isolation-forest');
    expect(result.isAnomaly).toBe(true);
    expect(result.anomalyScore).toBe(0.91);
    expect(result.id).toBe('pred1');
    const postedCall = httpService.post.mock.calls[0] as unknown as [
      string,
      { features: Record<string, number> },
    ];
    const posted = postedCall[1];
    expect(posted.features).toEqual(
      expect.objectContaining({
        latency_ms: 900,
        log_error_count: 12,
        anomaly_score: 0.9,
      }),
    );
    expect(result.features?.log_error_count).toBe(12);
    expect(alertsService.createSafely).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Anomalous prediction: Payment Gateway',
        serviceId: 's1',
      }),
    );
  });

  it('sends dependency telemetry and persists dependency evidence', async () => {
    servicesService.findById.mockImplementation((id: string) =>
      id === 's1'
        ? {
            id: 's1',
            name: 'Payment Gateway',
            status: ServiceStatus.DEGRADED,
          }
        : {
            id,
            name: 'Inventory Service',
            status: ServiceStatus.UNHEALTHY,
          },
    );
    dependenciesService.findByServiceId.mockImplementation((id: string) =>
      id === 's1'
        ? [
            {
              id: 'dep-1',
              sourceServiceId: 's1',
              targetServiceId: 's2',
              type: 'http',
              criticality: 'high',
            },
          ]
        : [],
    );
    metricsService.findByServiceId.mockImplementation((id: string) =>
      id === 's1'
        ? [{ name: 'latency_ms', value: 900 }]
        : [
            { name: 'error_rate', value: 0.12 },
            { name: 'latency_ms', value: 800 },
          ],
    );

    const result = await service.predict(
      {
        serviceId: 's1',
        symptom: 'Checkout is slow',
      },
      userId,
    );

    const postedCall = httpService.post.mock.calls[0] as unknown as [
      string,
      { context: { dependencies: Array<Record<string, unknown>> } },
    ];
    const posted = postedCall[1];
    expect(posted.context.dependencies).toEqual([
      expect.objectContaining({
        dependency_id: 'dep-1',
        dependency_name: 'Inventory Service',
        error_rate: 0.12,
        latency_ms: 800,
        health_status: ServiceStatus.UNHEALTHY,
        traffic_share: 1,
      }),
    ]);
    expect(result.dependencyEvidence?.[0].dependency_id).toBe('dep-1');
    const [savedCall] = predictionsRepository.create.mock.calls as unknown as [
      [{ dependencyEvidence: Array<{ dependency_id: string }> }],
    ];
    const saved = savedCall[0];
    expect(saved.dependencyEvidence[0].dependency_id).toBe('dep-1');
  });

  it('falls back to heuristic when AI service fails', async () => {
    const { throwError } = await import('rxjs');
    httpService.post.mockReturnValue(
      throwError(() => new Error('connection refused')),
    );

    const result = await service.predict(
      {
        serviceId: 's1',
        symptom: 'Checkout is slow',
      },
      userId,
    );

    expect(result.model.mode).toBe('rule-based-fallback');
    expect(result.predictions[0].confidence).toBe(0.9);
    expect(predictionsRepository.create).toHaveBeenCalled();
  });
});
