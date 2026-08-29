import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateUsabilityEventData,
  UsabilityTaskId,
  actorObjectId,
} from '../interfaces/usability.interface';
import {
  UsabilityEvent,
  UsabilityEventDocument,
} from '../schemas/usability-event.schema';
import {
  UsabilitySurvey,
  UsabilitySurveyDocument,
} from '../schemas/usability-survey.schema';

@Injectable()
export class UsabilityEventsRepository {
  constructor(
    @InjectModel(UsabilityEvent.name)
    private readonly eventModel: Model<UsabilityEventDocument>,
    @InjectModel(UsabilitySurvey.name)
    private readonly surveyModel: Model<UsabilitySurveyDocument>,
  ) {}

  async createEvent(
    actorId: string,
    data: CreateUsabilityEventData,
  ): Promise<UsabilityEventDocument> {
    return this.eventModel.create({
      ...data,
      actorId: actorObjectId(actorId),
      occurredAt: data.occurredAt ?? new Date(),
      properties: data.properties ?? {},
    });
  }

  async findEvents(
    from: Date,
    to: Date,
    taskId?: UsabilityTaskId,
    limit = 10_000,
  ): Promise<UsabilityEventDocument[]> {
    return this.eventModel
      .find({
        occurredAt: { $gte: from, $lte: to },
        ...(taskId ? { taskId } : {}),
      })
      .sort({ occurredAt: 1 })
      .limit(limit)
      .exec();
  }

  async createSurvey(data: {
    actorId: string;
    studySessionId: string;
    answers: number[];
    score: number;
    feedback?: string;
  }): Promise<UsabilitySurveyDocument> {
    return this.surveyModel.create({
      ...data,
      actorId: actorObjectId(data.actorId),
      submittedAt: new Date(),
    });
  }

  async findSurveyScores(
    from: Date,
    to: Date,
  ): Promise<Pick<UsabilitySurveyDocument, 'score'>[]> {
    return this.surveyModel
      .find({ submittedAt: { $gte: from, $lte: to } })
      .select({ score: 1 })
      .limit(10_000)
      .lean()
      .exec();
  }

  async deleteByActor(
    actorId: string,
  ): Promise<{ events: number; surveys: number }> {
    const actor = actorObjectId(actorId);
    const [events, surveys] = await Promise.all([
      this.eventModel.deleteMany({ actorId: actor }).exec(),
      this.surveyModel.deleteMany({ actorId: actor }).exec(),
    ]);
    return {
      events: events.deletedCount ?? 0,
      surveys: surveys.deletedCount ?? 0,
    };
  }
}
