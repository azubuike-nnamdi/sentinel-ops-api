import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { AlertStatus } from '../common/enums';
import { PaginationUtil } from '../common/utils';
import { PaginatedResult } from '../common/interfaces';
import { ALERT_DEDUPE_WINDOW_MS } from './alert-thresholds';
import { UpdateAlertDto } from './dto/update-alert.dto';
import {
  CreateAlertData,
  IAlert,
} from './interfaces/alert.interface';
import { AlertsRepository } from './repositories/alerts.repository';
import { AlertDocument } from './schemas/alert.schema';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly alertsRepository: AlertsRepository) {}

  async create(data: CreateAlertData): Promise<IAlert> {
    const since = new Date(Date.now() - ALERT_DEDUPE_WINDOW_MS);
    const duplicate = await this.alertsRepository.findActiveDuplicate(
      data.serviceId,
      data.title,
      since,
    );
    if (duplicate) {
      return this.toAlert(duplicate);
    }

    const alert = await this.alertsRepository.create({
      ...data,
      channel: data.channel ?? 'in-app',
    });
    return this.toAlert(alert);
  }

  async createSafely(data: CreateAlertData): Promise<IAlert | null> {
    try {
      return await this.create(data);
    } catch (error) {
      this.logger.warn(
        `Failed to create alert "${data.title}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

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

  async findRecent(limit = 5): Promise<IAlert[]> {
    const items = await this.alertsRepository.findMany(
      {},
      0,
      limit,
      { triggeredAt: -1 },
    );
    return items.map((item) => this.toAlert(item));
  }

  async countActive(): Promise<number> {
    return this.alertsRepository.countActive();
  }

  async update(id: string, dto: UpdateAlertDto): Promise<IAlert> {
    const payload: {
      status: UpdateAlertDto['status'];
      acknowledgedAt?: Date;
    } = { status: dto.status };
    if (dto.status === AlertStatus.ACKNOWLEDGED) {
      payload.acknowledgedAt = new Date();
    }

    const alert = await this.alertsRepository.updateById(id, payload);
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }
    return this.toAlert(alert);
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
