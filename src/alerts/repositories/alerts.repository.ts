import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Alert, AlertDocument } from '../schemas/alert.schema';
import { CreateAlertData } from '../interfaces/alert.interface';
import { AlertStatus } from '../../common/enums';

type AlertFilter = Record<string, unknown>;

@Injectable()
export class AlertsRepository {
  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: Model<AlertDocument>,
  ) {}

  async create(data: CreateAlertData): Promise<AlertDocument> {
    return this.alertModel.create({
      ...data,
      serviceId: new Types.ObjectId(data.serviceId),
      incidentId: data.incidentId
        ? new Types.ObjectId(data.incidentId)
        : null,
      triggeredAt: data.triggeredAt ?? new Date(),
    });
  }

  async findMany(
    filter: AlertFilter = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { triggeredAt: -1 },
  ): Promise<AlertDocument[]> {
    return this.alertModel.find(filter).skip(skip).limit(limit).sort(sort).exec();
  }

  async count(filter: AlertFilter = {}): Promise<number> {
    return this.alertModel.countDocuments(filter).exec();
  }

  async countActive(): Promise<number> {
    return this.alertModel
      .countDocuments({ status: AlertStatus.ACTIVE })
      .exec();
  }

  async findActiveDuplicate(
    serviceId: string,
    title: string,
    since: Date,
  ): Promise<AlertDocument | null> {
    return this.alertModel
      .findOne({
        serviceId: new Types.ObjectId(serviceId),
        title,
        status: AlertStatus.ACTIVE,
        triggeredAt: { $gte: since },
      })
      .exec();
  }

  async updateById(
    id: string,
    data: Partial<{
      status: AlertStatus;
      acknowledgedAt: Date | null;
    }>,
  ): Promise<AlertDocument | null> {
    return this.alertModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }
}
