import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PaginationUtil } from '../common/utils';
import { PaginatedResult } from '../common/interfaces';
import { ServicesService } from '../services/services.service';
import { CreateMetricDto } from './dto/create-metric.dto';
import { IMetric } from './interfaces/metric.interface';
import { MetricsRepository } from './repositories/metrics.repository';
import { MetricDocument } from './schemas/metric.schema';

@Injectable()
export class MetricsService {
  constructor(
    private readonly metricsRepository: MetricsRepository,
    private readonly servicesService: ServicesService,
  ) {}

  async create(dto: CreateMetricDto): Promise<IMetric> {
    await this.servicesService.findById(dto.serviceId);
    const metric = await this.metricsRepository.create({
      ...dto,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
    });
    return this.toMetric(metric);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<IMetric>> {
    const { page = 1, limit = 20, search, sort } = query;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { unit: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.metricsRepository.findMany(
        filter,
        PaginationUtil.getSkip(page, limit),
        limit,
        PaginationUtil.parseSort(sort, { timestamp: -1 }),
      ),
      this.metricsRepository.count(filter),
    ]);

    return PaginationUtil.buildResult(
      items.map((item) => this.toMetric(item)),
      total,
      page,
      limit,
    );
  }

  async countSince(hours = 24): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsRepository.countSince(since);
  }

  toMetric(metric: MetricDocument): IMetric {
    return {
      id: metric.id as string,
      serviceId: (metric.serviceId as Types.ObjectId).toString(),
      name: metric.name,
      type: metric.type,
      value: metric.value,
      unit: metric.unit,
      labels: metric.labels,
      timestamp: metric.timestamp,
      createdAt: metric.createdAt,
      updatedAt: metric.updatedAt,
    };
  }
}
