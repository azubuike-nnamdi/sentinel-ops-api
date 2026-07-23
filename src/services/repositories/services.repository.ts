import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MonitoredService,
  ServiceDocument,
} from '../schemas/service.schema';
import { CreateServiceData } from '../interfaces/service.interface';

type ServiceFilter = Record<string, unknown>;

@Injectable()
export class ServicesRepository {
  constructor(
    @InjectModel(MonitoredService.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async create(data: CreateServiceData): Promise<ServiceDocument> {
    return this.serviceModel.create(data);
  }

  async findById(id: string): Promise<ServiceDocument | null> {
    return this.serviceModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<ServiceDocument | null> {
    return this.serviceModel.findOne({ slug }).exec();
  }

  async findMany(
    filter: ServiceFilter = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
  ): Promise<ServiceDocument[]> {
    return this.serviceModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .exec();
  }

  async count(filter: ServiceFilter = {}): Promise<number> {
    return this.serviceModel.countDocuments(filter).exec();
  }

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await this.serviceModel.aggregate<{
      _id: string;
      count: number;
    }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});
  }
}
