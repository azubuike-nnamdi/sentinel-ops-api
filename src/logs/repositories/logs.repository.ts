import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LogEntry, LogDocument } from '../schemas/log.schema';
import { CreateLogData } from '../interfaces/log.interface';

type LogFilter = Record<string, unknown>;

@Injectable()
export class LogsRepository {
  constructor(
    @InjectModel(LogEntry.name)
    private readonly logModel: Model<LogDocument>,
  ) {}

  async create(data: CreateLogData): Promise<LogDocument> {
    return this.logModel.create({
      ...data,
      serviceId: new Types.ObjectId(data.serviceId),
      timestamp: data.timestamp ?? new Date(),
    });
  }

  async createMany(data: CreateLogData[]): Promise<LogDocument[]> {
    const docs = data.map((item) => ({
      ...item,
      serviceId: new Types.ObjectId(item.serviceId),
      timestamp: item.timestamp ?? new Date(),
    }));
    return this.logModel.insertMany(docs) as unknown as Promise<LogDocument[]>;
  }

  async findMany(
    filter: LogFilter = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { timestamp: -1 },
  ): Promise<LogDocument[]> {
    return this.logModel.find(filter).skip(skip).limit(limit).sort(sort).exec();
  }

  async count(filter: LogFilter = {}): Promise<number> {
    return this.logModel.countDocuments(filter).exec();
  }

  async countSince(since: Date): Promise<number> {
    return this.logModel.countDocuments({ timestamp: { $gte: since } }).exec();
  }
}
