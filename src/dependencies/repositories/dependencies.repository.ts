import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ServiceDependency,
  DependencyDocument,
} from '../schemas/dependency.schema';

type DependencyFilter = Record<string, unknown>;

@Injectable()
export class DependenciesRepository {
  constructor(
    @InjectModel(ServiceDependency.name)
    private readonly dependencyModel: Model<DependencyDocument>,
  ) {}

  async findMany(
    filter: DependencyFilter = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
  ): Promise<DependencyDocument[]> {
    return this.dependencyModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .exec();
  }

  async count(filter: DependencyFilter = {}): Promise<number> {
    return this.dependencyModel.countDocuments(filter).exec();
  }
}
