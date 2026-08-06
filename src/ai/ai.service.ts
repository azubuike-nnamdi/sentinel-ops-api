import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { AnomaliesService } from '../anomalies/anomalies.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces';
import { PaginationUtil } from '../common/utils';
import { DependenciesService } from '../dependencies/dependencies.service';
import { MetricsService } from '../metrics/metrics.service';
import { ServicesService } from '../services/services.service';
import { PredictDto } from './dto/predict.dto';
import {
  AiPredictRequestPayload,
  AiPredictResponsePayload,
  PredictResult,
  PredictionCandidate,
} from './interfaces/predict.interface';
import { PredictionsRepository } from './repositories/predictions.repository';
import { PredictionDocument } from './schemas/prediction.schema';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly servicesService: ServicesService,
    private readonly anomaliesService: AnomaliesService,
    private readonly dependenciesService: DependenciesService,
    private readonly metricsService: MetricsService,
    private readonly predictionsRepository: PredictionsRepository,
  ) {}

  async predict(dto: PredictDto, userId: string): Promise<PredictResult> {
    const service = await this.servicesService.findById(dto.serviceId);
    const [relatedAnomalies, relatedDependencies, relatedMetrics] =
      await Promise.all([
        this.anomaliesService.findByServiceId(dto.serviceId, 50),
        this.dependenciesService.findByServiceId(dto.serviceId, 50),
        this.metricsService.findByServiceId(dto.serviceId, 50),
      ]);

    const features = this.buildFeatures(
      relatedMetrics,
      relatedAnomalies,
      relatedDependencies,
      dto.context,
    );

    const payload: AiPredictRequestPayload = {
      service_id: service.id,
      service_name: service.name,
      symptom: dto.symptom,
      signals: dto.signals || [],
      features,
      context: {
        ...(dto.context || {}),
        serviceStatus: service.status,
      },
      top_k: dto.topK ?? 5,
    };

    let result: PredictResult;
    try {
      result = await this.callIsolationForest(service, dto, payload);
    } catch (error) {
      const fallbackEnabled =
        this.configService.get<boolean>('ai.fallbackEnabled') !== false;

      if (!fallbackEnabled) {
        throw new ServiceUnavailableException(
          'AI Isolation Forest service is unavailable',
        );
      }

      this.logger.warn(
        `AI service unreachable; using heuristic fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      result = this.heuristicPredict(
        service,
        dto,
        relatedAnomalies,
        relatedDependencies,
      );
    }

    const saved = await this.predictionsRepository.create({
      createdBy: userId,
      serviceId: service.id,
      serviceName: service.name,
      serviceStatus: service.status,
      symptom: result.symptom,
      signals: result.signals,
      predictions: result.predictions,
      modelInfo: result.model,
      isAnomaly: result.isAnomaly ?? null,
      anomalyScore: result.anomalyScore ?? null,
      features,
      signalCounts: {
        anomalies: relatedAnomalies.length,
        metrics: relatedMetrics.length,
        dependencies: relatedDependencies.length,
      },
      generatedAt: new Date(result.generatedAt),
    });

    return {
      ...result,
      id: saved.id as string,
      signalCounts: {
        anomalies: relatedAnomalies.length,
        metrics: relatedMetrics.length,
        dependencies: relatedDependencies.length,
      },
    };
  }

  async findAll(
    query: PaginationQueryDto,
    userId?: string,
  ): Promise<PaginatedResult<PredictResult>> {
    const { page = 1, limit = 20, search, sort } = query;
    const filter: Record<string, unknown> = userId
      ? { createdBy: new Types.ObjectId(userId) }
      : {};

    if (search) {
      filter.$or = [
        { symptom: { $regex: search, $options: 'i' } },
        { serviceName: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.predictionsRepository.findMany(
        filter,
        PaginationUtil.getSkip(page, limit),
        limit,
        PaginationUtil.parseSort(sort, { createdAt: -1 }),
      ),
      this.predictionsRepository.count(filter),
    ]);

    return PaginationUtil.buildResult(
      items.map((item) => this.toPredictResult(item)),
      total,
      page,
      limit,
    );
  }

  async findById(id: string): Promise<PredictResult> {
    const prediction = await this.predictionsRepository.findById(id);
    if (!prediction) {
      throw new NotFoundException('Prediction not found');
    }
    return this.toPredictResult(prediction);
  }

  private async callIsolationForest(
    service: { id: string; name: string; status: string },
    dto: PredictDto,
    payload: AiPredictRequestPayload,
  ): Promise<PredictResult> {
    const baseUrl = (
      this.configService.get<string>('ai.serviceUrl') || 'http://localhost:8001'
    ).replace(/\/$/, '');
    const timeoutMs = this.configService.get<number>('ai.timeoutMs') || 10_000;

    const { data } = await firstValueFrom(
      this.httpService.post<AiPredictResponsePayload>(
        `${baseUrl}/predict`,
        payload,
        { timeout: timeoutMs },
      ),
    );

    return {
      service: {
        id: service.id,
        name: service.name,
        status: service.status,
      },
      symptom: dto.symptom,
      signals: dto.signals || [],
      predictions: data.predictions.map((p) => ({
        type: p.type,
        confidence: p.confidence,
        summary: p.summary,
        evidenceId: p.evidence_id || service.id,
        metricName: p.metric_name || undefined,
      })),
      model: {
        name: data.model.name,
        mode: data.model.mode,
      },
      isAnomaly: data.is_anomaly,
      anomalyScore: data.anomaly_score,
      generatedAt: data.generated_at,
    };
  }

  private buildFeatures(
    metrics: Array<{ name: string; value: number }>,
    anomalies: Array<{ score: number }>,
    dependencies: Array<{ criticality: string }>,
    context?: Record<string, unknown>,
  ) {
    const byName = (needle: string) =>
      metrics.find((m) => m.name.toLowerCase().includes(needle))?.value;

    const maxAnomaly =
      anomalies.length > 0 ? Math.max(...anomalies.map((a) => a.score)) : 0;

    const riskFromCriticality = (c: string): number => {
      switch (c.toLowerCase()) {
        case 'critical':
          return 1;
        case 'high':
          return 0.75;
        case 'medium':
          return 0.45;
        case 'low':
          return 0.2;
        default:
          return 0.3;
      }
    };

    const dependencyRisk =
      dependencies.length > 0
        ? Math.max(
            ...dependencies.map((d) => riskFromCriticality(d.criticality)),
          )
        : 0;

    const ctxNum = (key: string): number | undefined => {
      const v = context?.[key];
      return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
    };

    return {
      error_rate: ctxNum('error_rate') ?? byName('error') ?? 0,
      latency_ms: ctxNum('latency_ms') ?? byName('latency') ?? 0,
      cpu_pct: ctxNum('cpu_pct') ?? byName('cpu') ?? 0,
      memory_pct: ctxNum('memory_pct') ?? byName('memory') ?? 0,
      anomaly_score: ctxNum('anomaly_score') ?? maxAnomaly,
      dependency_risk: ctxNum('dependency_risk') ?? dependencyRisk,
      log_error_count: ctxNum('log_error_count') ?? 0,
    };
  }

  private heuristicPredict(
    service: { id: string; name: string; status: string },
    dto: PredictDto,
    relatedAnomalies: Array<{
      id: string;
      score: number;
      description: string;
      metricName: string;
    }>,
    relatedDependencies: Array<{
      id: string;
      criticality: string;
      type: string;
    }>,
  ): PredictResult {
    const candidates: PredictionCandidate[] = [
      ...relatedAnomalies.map((anomaly) => ({
        type: 'anomaly' as const,
        confidence: anomaly.score,
        summary: anomaly.description,
        metricName: anomaly.metricName,
        evidenceId: anomaly.id,
      })),
      ...relatedDependencies
        .filter(
          (dep) =>
            dep.criticality === 'critical' || dep.criticality === 'high',
        )
        .map((dep) => ({
          type: 'dependency' as const,
          confidence: dep.criticality === 'critical' ? 0.8 : 0.65,
          summary: `Potential upstream/downstream impact via ${dep.type} dependency`,
          evidenceId: dep.id,
        })),
    ]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, dto.topK ?? 5);

    if (candidates.length === 0) {
      candidates.push({
        type: 'anomaly',
        confidence: 0.4,
        summary: `Heuristic RCA for "${dto.symptom}" on ${service.name}: AI service unavailable and insufficient correlated signals`,
        metricName: 'unknown',
        evidenceId: service.id,
      });
    }

    return {
      service: {
        id: service.id,
        name: service.name,
        status: service.status,
      },
      symptom: dto.symptom,
      signals: dto.signals || [],
      predictions: candidates,
      model: {
        name: 'sentinelops-heuristic-rca-v1',
        mode: 'rule-based-fallback',
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private toPredictResult(doc: PredictionDocument): PredictResult {
    return {
      id: doc.id as string,
      service: {
        id: (doc.serviceId as Types.ObjectId).toString(),
        name: doc.serviceName,
        status: doc.serviceStatus,
      },
      symptom: doc.symptom,
      signals: doc.signals,
      predictions: doc.predictions as PredictionCandidate[],
      model: doc.modelInfo,
      isAnomaly: doc.isAnomaly ?? undefined,
      anomalyScore: doc.anomalyScore ?? undefined,
      signalCounts: doc.signalCounts,
      generatedAt: doc.generatedAt.toISOString(),
    };
  }
}
