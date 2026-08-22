import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AlertsService } from '../alerts/alerts.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { AlertSeverity } from '../common/enums';
import { PaginationUtil } from '../common/utils';
import { PaginatedResult } from '../common/interfaces';
import { ServicesService } from '../services/services.service';
import { CreateAnomalyDto } from './dto/create-anomaly.dto';
import { IAnomaly } from './interfaces/anomaly.interface';
import { AnomaliesRepository } from './repositories/anomalies.repository';
import { AnomalyDocument } from './schemas/anomaly.schema';

@Injectable()
export class AnomaliesService {
  constructor(
    private readonly anomaliesRepository: AnomaliesRepository,
    private readonly servicesService: ServicesService,
    private readonly alertsService: AlertsService,
  ) { }

  async create(dto: CreateAnomalyDto): Promise<IAnomaly> {
    await this.servicesService.findById(dto.serviceId);
    const anomaly = await this.anomaliesRepository.create({
      ...dto,
      detectedAt: dto.detectedAt ? new Date(dto.detectedAt) : new Date(),
    });
    const created = this.toAnomaly(anomaly);
    await this.alertsService.createSafely({
      title: `Anomaly: ${created.metricName}`,
      message: created.description,
      severity:
        created.score >= 0.8 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
      serviceId: created.serviceId,
      channel: 'in-app',
    });
    return created;
  }

  async findByServiceId(serviceId: string, limit = 50): Promise<IAnomaly[]> {
    const items = await this.anomaliesRepository.findMany(
      { serviceId: new Types.ObjectId(serviceId) },
      0,
      limit,
      { detectedAt: -1 },
    );
    return items.map((item) => this.toAnomaly(item));
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<IAnomaly>> {
    const { page = 1, limit = 20, search, sort } = query;
    const filter = search
      ? {
        $or: [
          { metricName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      }
      : {};

    const [items, total] = await Promise.all([
      this.anomaliesRepository.findMany(
        filter,
        PaginationUtil.getSkip(page, limit),
        limit,
        PaginationUtil.parseSort(sort, { detectedAt: -1 }),
      ),
      this.anomaliesRepository.count(filter),
    ]);

    return PaginationUtil.buildResult(
      items.map((item) => this.toAnomaly(item)),
      total,
      page,
      limit,
    );
  }

  async countOpen(): Promise<number> {
    return this.anomaliesRepository.countOpen();
  }

  toAnomaly(anomaly: AnomalyDocument): IAnomaly {
    return {
      id: anomaly.id,
      serviceId: anomaly.serviceId.toString(),
      metricName: anomaly.metricName,
      score: anomaly.score,
      status: anomaly.status,
      description: anomaly.description,
      detectedAt: anomaly.detectedAt,
      evidence: anomaly.evidence,
      createdAt: anomaly.createdAt,
      updatedAt: anomaly.updatedAt,
    };
  }
}
