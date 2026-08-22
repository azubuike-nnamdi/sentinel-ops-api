import { Injectable } from '@nestjs/common';
import { AlertsService } from '../alerts/alerts.service';
import {
  logErrorVolumeMatch,
  matchMetricThreshold,
} from '../alerts/alert-thresholds';
import { LogLevel } from '../common/enums';
import { SensitiveDataUtil } from '../common/utils';
import { LogsRepository } from '../logs/repositories/logs.repository';
import { MetricsRepository } from '../metrics/repositories/metrics.repository';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';

@Injectable()
export class TelemetryService {
  constructor(
    private readonly logsRepository: LogsRepository,
    private readonly metricsRepository: MetricsRepository,
    private readonly alertsService: AlertsService,
  ) {}

  async ingest(dto: IngestTelemetryDto) {
    const logs = (dto.logs || []).map((log) =>
      SensitiveDataUtil.sanitizeLogPayload(log),
    );
    const metrics = dto.metrics || [];
    const source = SensitiveDataUtil.sanitizeObject(dto.source) || {};

    const [createdLogs, createdMetrics] = await Promise.all([
      logs.length > 0
        ? this.logsRepository.createMany(logs)
        : Promise.resolve([]),
      metrics.length > 0
        ? this.metricsRepository.createMany(metrics)
        : Promise.resolve([]),
    ]);

    await this.emitThresholdAlerts(logs, metrics);

    return {
      accepted: {
        logs: createdLogs.length,
        metrics: createdMetrics.length,
      },
      source,
      ingestedAt: new Date().toISOString(),
    };
  }

  private async emitThresholdAlerts(
    logs: Array<{ serviceId: string; level: LogLevel }>,
    metrics: Array<{ serviceId: string; name: string; value: number }>,
  ): Promise<void> {
    const jobs: Array<Promise<unknown>> = [];

    for (const metric of metrics) {
      const match = matchMetricThreshold(metric.name, metric.value);
      if (!match) {
        continue;
      }
      jobs.push(
        this.alertsService.createSafely({
          title: match.title,
          message: match.message,
          severity: match.severity,
          serviceId: metric.serviceId,
          channel: 'in-app',
        }),
      );
    }

    const errorCounts = new Map<string, number>();
    for (const log of logs) {
      if (log.level === LogLevel.ERROR || log.level === LogLevel.FATAL) {
        errorCounts.set(
          log.serviceId,
          (errorCounts.get(log.serviceId) ?? 0) + 1,
        );
      }
    }
    for (const [serviceId, count] of errorCounts) {
      const match = logErrorVolumeMatch(count);
      if (!match) {
        continue;
      }
      jobs.push(
        this.alertsService.createSafely({
          title: match.title,
          message: match.message,
          severity: match.severity,
          serviceId,
          channel: 'in-app',
        }),
      );
    }

    if (jobs.length > 0) {
      await Promise.all(jobs);
    }
  }
}
