import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Incident, IncidentDocument } from '../schemas/incident.schema';
import {
  CreateIncidentData,
  UpdateIncidentData,
} from '../interfaces/incident.interface';
import { IncidentStatus } from '../../common/enums';

type IncidentFilter = Record<string, unknown>;

@Injectable()
export class IncidentsRepository {
  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
  ) {}

  async create(data: CreateIncidentData): Promise<IncidentDocument> {
    return this.incidentModel.create({
      ...data,
      serviceIds: (data.serviceIds || []).map((id) => new Types.ObjectId(id)),
      anomalyIds: (data.anomalyIds || []).map((id) => new Types.ObjectId(id)),
      assignedTo: data.assignedTo
        ? new Types.ObjectId(data.assignedTo)
        : null,
    });
  }

  async findById(id: string): Promise<IncidentDocument | null> {
    return this.incidentModel.findById(id).exec();
  }

  async findMany(
    filter: IncidentFilter = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
  ): Promise<IncidentDocument[]> {
    return this.incidentModel.find(filter).skip(skip).limit(limit).sort(sort).exec();
  }

  async count(filter: IncidentFilter = {}): Promise<number> {
    return this.incidentModel.countDocuments(filter).exec();
  }

  async updateById(
    id: string,
    data: UpdateIncidentData,
  ): Promise<IncidentDocument | null> {
    const $set: Record<string, unknown> = { ...data };
    if (data.serviceIds) {
      $set.serviceIds = data.serviceIds.map((sid) => new Types.ObjectId(sid));
    }
    if (data.anomalyIds) {
      $set.anomalyIds = data.anomalyIds.map((aid) => new Types.ObjectId(aid));
    }
    if (data.assignedTo !== undefined) {
      $set.assignedTo = data.assignedTo
        ? new Types.ObjectId(data.assignedTo)
        : null;
    }

    const update: UpdateQuery<IncidentDocument> = { $set };
    return this.incidentModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }

  async countOpen(): Promise<number> {
    return this.incidentModel
      .countDocuments({
        status: {
          $nin: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
        },
      })
      .exec();
  }
}
