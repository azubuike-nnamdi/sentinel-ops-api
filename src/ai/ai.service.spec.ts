import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { AnomaliesService } from '../anomalies/anomalies.service';
import { DependenciesService } from '../dependencies/dependencies.service';
import { MetricsService } from '../metrics/metrics.service';
import { ServicesService } from '../services/services.service';
import { ServiceStatus } from '../common/enums';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;
  let httpService: { post: jest.Mock };

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
          useValue: {
            findById: jest.fn().mockResolvedValue({
              id: 's1',
              name: 'Payment Gateway',
              status: ServiceStatus.DEGRADED,
            }),
          },
        },
        {
          provide: AnomaliesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue({
              items: [
                {
                  id: 'a1',
                  serviceId: 's1',
                  metricName: 'latency',
                  score: 0.9,
                  description: 'Latency spike',
                },
              ],
            }),
          },
        },
        {
          provide: DependenciesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue({ items: [] }),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue({
              items: [
                {
                  serviceId: 's1',
                  name: 'latency_ms',
                  value: 900,
                },
              ],
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AiService);
  });

  it('returns Isolation Forest predictions from AI service', async () => {
    const result = await service.predict({
      serviceId: 's1',
      symptom: 'Checkout is slow',
    });

    expect(httpService.post).toHaveBeenCalled();
    expect(result.predictions.length).toBeGreaterThan(0);
    expect(result.predictions[0].confidence).toBe(0.9);
    expect(result.model.name).toContain('isolation-forest');
    expect(result.isAnomaly).toBe(true);
    expect(result.anomalyScore).toBe(0.91);
  });

  it('falls back to heuristic when AI service fails', async () => {
    const { throwError } = await import('rxjs');
    httpService.post.mockReturnValue(
      throwError(() => new Error('connection refused')),
    );

    const result = await service.predict({
      serviceId: 's1',
      symptom: 'Checkout is slow',
    });

    expect(result.model.mode).toBe('rule-based-fallback');
    expect(result.predictions[0].confidence).toBe(0.9);
  });
});
