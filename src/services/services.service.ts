import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PaginationUtil } from '../common/utils';
import { PaginatedResult } from '../common/interfaces';
import { CreateServiceDto } from './dto/create-service.dto';
import { IService } from './interfaces/service.interface';
import { ServicesRepository } from './repositories/services.repository';
import { ServiceDocument } from './schemas/service.schema';

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) {}

  async create(dto: CreateServiceDto): Promise<IService> {
    const existing = await this.servicesRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException('A service with this slug already exists');
    }

    const service = await this.servicesRepository.create(dto);
    return this.toService(service);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<IService>> {
    const { page = 1, limit = 20, search, sort } = query;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
            { owner: { $regex: search, $options: 'i' } },
            { environment: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.servicesRepository.findMany(
        filter,
        PaginationUtil.getSkip(page, limit),
        limit,
        PaginationUtil.parseSort(sort),
      ),
      this.servicesRepository.count(filter),
    ]);

    return PaginationUtil.buildResult(
      items.map((item) => this.toService(item)),
      total,
      page,
      limit,
    );
  }

  async findById(id: string): Promise<IService> {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return this.toService(service);
  }

  async countByStatus(): Promise<Record<string, number>> {
    return this.servicesRepository.countByStatus();
  }

  async countAll(): Promise<number> {
    return this.servicesRepository.count();
  }

  toService(service: ServiceDocument): IService {
    return {
      id: service.id as string,
      name: service.name,
      slug: service.slug,
      description: service.description,
      owner: service.owner,
      environment: service.environment,
      status: service.status,
      endpoints: service.endpoints,
      tags: service.tags,
      metadata: service.metadata,
      isActive: service.isActive,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
