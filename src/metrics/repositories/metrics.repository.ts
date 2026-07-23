import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Metric, MetricDocument } from '../schemas/metric.schema';
import { CreateMetricData } from '../interfaces/metric.interface';

type MetricFilter = Record<string, unknown>;

@Injectable()
export class MetricsRepository {
  constructor(
    @InjectModel(Metric.name)
    private readonly metricModel: Model<MetricDocument>,
  ) {}

  async create(data: CreateMetricData): Promise<MetricDocument> {
    return this.metricModel.create({
      ...data,
      serviceId: new Types.ObjectId(data.serviceId),
      timestamp: data.timestamp ?? new Date(),
    });
  }

  async createMany(data: CreateMetricData[]): Promise<MetricDocument[]> {
    const docs = data.map((item) => ({
      ...item,
      serviceId: new Types.ObjectId(item.serviceId),
      timestamp: item.timestamp ?? new Date(),
    }));
    return this.metricModel.insertMany(docs) as unknown as Promise<MetricDocument[]>;
  }

  async findMany(
    filter: MetricFilter = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { timestamp: -1 },
  ): Promise<MetricDocument[]> {
    return this.metricModel.find(filter).skip(skip).limit(limit).sort(sort).exec();
  }

  async count(filter: MetricFilter = {}): Promise<number> {
    return this.metricModel.countDocuments(filter).exec();
  }

  async countSince(since: Date): Promise<number> {
    return this.metricModel.countDocuments({ timestamp: { $gte: since } }).exec();
  }
}
