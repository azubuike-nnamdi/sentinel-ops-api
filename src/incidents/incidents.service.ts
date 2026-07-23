import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { IncidentStatus } from '../common/enums';
import { PaginationUtil } from '../common/utils';
import { PaginatedResult } from '../common/interfaces';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
} from './dto/incident.dto';
import { IIncident } from './interfaces/incident.interface';
import { IncidentsRepository } from './repositories/incidents.repository';
import { IncidentDocument } from './schemas/incident.schema';

@Injectable()
export class IncidentsService {
  constructor(private readonly incidentsRepository: IncidentsRepository) {}

  async create(dto: CreateIncidentDto): Promise<IIncident> {
    const incident = await this.incidentsRepository.create(dto);
    return this.toIncident(incident);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<IIncident>> {
    const { page = 1, limit = 20, search, sort } = query;
    const filter = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { rootCause: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.incidentsRepository.findMany(
        filter,
        PaginationUtil.getSkip(page, limit),
        limit,
        PaginationUtil.parseSort(sort),
      ),
      this.incidentsRepository.count(filter),
    ]);

    return PaginationUtil.buildResult(
      items.map((item) => this.toIncident(item)),
      total,
      page,
      limit,
    );
  }

  async findById(id: string): Promise<IIncident> {
    const incident = await this.incidentsRepository.findById(id);
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return this.toIncident(incident);
  }

  async update(id: string, dto: UpdateIncidentDto): Promise<IIncident> {
    const resolvedStatuses = [IncidentStatus.RESOLVED, IncidentStatus.CLOSED];
    const payload = {
      ...dto,
      resolvedAt:
        dto.status && resolvedStatuses.includes(dto.status)
          ? new Date()
          : undefined,
    };

    const incident = await this.incidentsRepository.updateById(id, payload);
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return this.toIncident(incident);
  }

  async countOpen(): Promise<number> {
    return this.incidentsRepository.countOpen();
  }

  toIncident(incident: IncidentDocument): IIncident {
    return {
      id: incident.id as string,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      serviceIds: (incident.serviceIds || []).map((id) =>
        (id as Types.ObjectId).toString(),
      ),
      anomalyIds: (incident.anomalyIds || []).map((id) =>
        (id as Types.ObjectId).toString(),
      ),
      rootCause: incident.rootCause,
      assignedTo: incident.assignedTo
        ? (incident.assignedTo as Types.ObjectId).toString()
        : null,
      resolvedAt: incident.resolvedAt,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
    };
  }
}
