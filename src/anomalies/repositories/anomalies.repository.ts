import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Anomaly, AnomalyDocument } from '../schemas/anomaly.schema';
import { CreateAnomalyData } from '../interfaces/anomaly.interface';
import { AnomalyStatus } from '../../common/enums';

type AnomalyFilter = Record<string, unknown>;

@Injectable()
export class AnomaliesRepository {
  constructor(
    @InjectModel(Anomaly.name)
    private readonly anomalyModel: Model<AnomalyDocument>,
  ) {}

  async create(data: CreateAnomalyData): Promise<AnomalyDocument> {
    return this.anomalyModel.create({
      ...data,
      serviceId: new Types.ObjectId(data.serviceId),
      detectedAt: data.detectedAt ?? new Date(),
    });
  }

  async findMany(
    filter: AnomalyFilter = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { detectedAt: -1 },
  ): Promise<AnomalyDocument[]> {
    return this.anomalyModel.find(filter).skip(skip).limit(limit).sort(sort).exec();
  }

  async count(filter: AnomalyFilter = {}): Promise<number> {
    return this.anomalyModel.countDocuments(filter).exec();
  }

  async countOpen(): Promise<number> {
    return this.anomalyModel
      .countDocuments({
        status: {
          $in: [AnomalyStatus.DETECTED, AnomalyStatus.CONFIRMED],
        },
      })
      .exec();
  }
}
