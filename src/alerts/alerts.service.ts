import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PaginationUtil } from '../common/utils';
import { PaginatedResult } from '../common/interfaces';
import { IAlert } from './interfaces/alert.interface';
import { AlertsRepository } from './repositories/alerts.repository';
import { AlertDocument } from './schemas/alert.schema';

@Injectable()
export class AlertsService {
  constructor(private readonly alertsRepository: AlertsRepository) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<IAlert>> {
    const { page = 1, limit = 20, search, sort } = query;
    const filter = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { message: { $regex: search, $options: 'i' } },
            { channel: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.alertsRepository.findMany(
        filter,
        PaginationUtil.getSkip(page, limit),
        limit,
        PaginationUtil.parseSort(sort, { triggeredAt: -1 }),
      ),
      this.alertsRepository.count(filter),
    ]);

    return PaginationUtil.buildResult(
      items.map((item) => this.toAlert(item)),
      total,
      page,
      limit,
    );
  }

  async countActive(): Promise<number> {
    return this.alertsRepository.countActive();
  }

  toAlert(alert: AlertDocument): IAlert {
    return {
      id: alert.id as string,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      status: alert.status,
      serviceId: (alert.serviceId as Types.ObjectId).toString(),
      incidentId: alert.incidentId
        ? (alert.incidentId as Types.ObjectId).toString()
        : null,
      channel: alert.channel,
      triggeredAt: alert.triggeredAt,
      acknowledgedAt: alert.acknowledgedAt,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };
  }
}
