import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ServiceDependency,
  DependencyDocument,
} from '../schemas/dependency.schema';
import { DependencyType } from '../../common/enums';

type DependencyFilter = Record<string, unknown>;

export interface CreateDependencyData {
  sourceServiceId: string;
  targetServiceId: string;
  type: DependencyType;
  criticality?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class DependenciesRepository {
  constructor(
    @InjectModel(ServiceDependency.name)
    private readonly dependencyModel: Model<DependencyDocument>,
  ) {}

  async create(data: CreateDependencyData): Promise<DependencyDocument> {
    return this.dependencyModel.create({
      sourceServiceId: new Types.ObjectId(data.sourceServiceId),
      targetServiceId: new Types.ObjectId(data.targetServiceId),
      type: data.type,
      criticality: data.criticality,
      description: data.description,
      isActive: data.isActive ?? true,
    });
  }

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
