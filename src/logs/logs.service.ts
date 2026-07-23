import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PaginationUtil } from '../common/utils';
import { PaginatedResult } from '../common/interfaces';
import { ServicesService } from '../services/services.service';
import { CreateLogDto } from './dto/create-log.dto';
import { ILog } from './interfaces/log.interface';
import { LogsRepository } from './repositories/logs.repository';
import { LogDocument } from './schemas/log.schema';

@Injectable()
export class LogsService {
  constructor(
    private readonly logsRepository: LogsRepository,
    private readonly servicesService: ServicesService,
  ) {}

  async create(dto: CreateLogDto): Promise<ILog> {
    await this.servicesService.findById(dto.serviceId);
    const log = await this.logsRepository.create({
      ...dto,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
    });
    return this.toLog(log);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<ILog>> {
    const { page = 1, limit = 20, search, sort } = query;
    const filter = search
      ? {
          $or: [
            { message: { $regex: search, $options: 'i' } },
            { traceId: { $regex: search, $options: 'i' } },
            { source: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.logsRepository.findMany(
        filter,
        PaginationUtil.getSkip(page, limit),
        limit,
        PaginationUtil.parseSort(sort, { timestamp: -1 }),
      ),
      this.logsRepository.count(filter),
    ]);

    return PaginationUtil.buildResult(
      items.map((item) => this.toLog(item)),
      total,
      page,
      limit,
    );
  }

  async countSince(hours = 24): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.logsRepository.countSince(since);
  }

  toLog(log: LogDocument): ILog {
    return {
      id: log.id as string,
      serviceId: (log.serviceId as Types.ObjectId).toString(),
      level: log.level,
      message: log.message,
      timestamp: log.timestamp,
      traceId: log.traceId,
      spanId: log.spanId,
      source: log.source,
      host: log.host,
      metadata: log.metadata,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }
}
