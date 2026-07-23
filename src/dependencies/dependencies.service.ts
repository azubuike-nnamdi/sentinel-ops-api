import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PaginationUtil } from '../common/utils';
import { PaginatedResult } from '../common/interfaces';
import { IDependency } from './interfaces/dependency.interface';
import { DependenciesRepository } from './repositories/dependencies.repository';
import { DependencyDocument } from './schemas/dependency.schema';

@Injectable()
export class DependenciesService {
  constructor(
    private readonly dependenciesRepository: DependenciesRepository,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<IDependency>> {
    const { page = 1, limit = 20, search, sort } = query;
    const filter = search
      ? {
          $or: [
            { description: { $regex: search, $options: 'i' } },
            { type: { $regex: search, $options: 'i' } },
            { criticality: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.dependenciesRepository.findMany(
        filter,
        PaginationUtil.getSkip(page, limit),
        limit,
        PaginationUtil.parseSort(sort),
      ),
      this.dependenciesRepository.count(filter),
    ]);

    return PaginationUtil.buildResult(
      items.map((item) => this.toDependency(item)),
      total,
      page,
      limit,
    );
  }

  async countAll(): Promise<number> {
    return this.dependenciesRepository.count();
  }

  toDependency(dependency: DependencyDocument): IDependency {
    return {
      id: dependency.id as string,
      sourceServiceId: (
        dependency.sourceServiceId as Types.ObjectId
      ).toString(),
      targetServiceId: (
        dependency.targetServiceId as Types.ObjectId
      ).toString(),
      type: dependency.type,
      criticality: dependency.criticality,
      description: dependency.description,
      isActive: dependency.isActive,
      createdAt: dependency.createdAt,
      updatedAt: dependency.updatedAt,
    };
  }
}
