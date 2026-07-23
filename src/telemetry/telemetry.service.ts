import { Injectable } from '@nestjs/common';
import { LogsRepository } from '../logs/repositories/logs.repository';
import { MetricsRepository } from '../metrics/repositories/metrics.repository';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';

@Injectable()
export class TelemetryService {
  constructor(
    private readonly logsRepository: LogsRepository,
    private readonly metricsRepository: MetricsRepository,
  ) {}

  async ingest(dto: IngestTelemetryDto) {
    const logs = dto.logs || [];
    const metrics = dto.metrics || [];

    const [createdLogs, createdMetrics] = await Promise.all([
      logs.length > 0 ? this.logsRepository.createMany(logs) : Promise.resolve([]),
      metrics.length > 0
        ? this.metricsRepository.createMany(metrics)
        : Promise.resolve([]),
    ]);

    return {
      accepted: {
        logs: createdLogs.length,
        metrics: createdMetrics.length,
      },
      source: dto.source || {},
      ingestedAt: new Date().toISOString(),
    };
  }
}
