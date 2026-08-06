import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Prediction,
  PredictionDocument,
} from '../schemas/prediction.schema';

export interface CreatePredictionData {
  createdBy: string;
  serviceId: string;
  serviceName: string;
  serviceStatus: string;
  symptom: string;
  signals: string[];
  predictions: Array<{
    type: string;
    confidence: number;
    summary: string;
    evidenceId: string;
    metricName?: string;
  }>;
  modelInfo: {
    name: string;
    mode: string;
  };
  isAnomaly: boolean | null;
  anomalyScore: number | null;
  features: Record<string, number>;
  signalCounts: {
    anomalies: number;
    metrics: number;
    dependencies: number;
  };
  generatedAt: Date;
}

@Injectable()
export class PredictionsRepository {
  constructor(
    @InjectModel(Prediction.name)
    private readonly predictionModel: Model<PredictionDocument>,
  ) {}

  async create(data: CreatePredictionData): Promise<PredictionDocument> {
    return this.predictionModel.create({
      createdBy: new Types.ObjectId(data.createdBy),
      serviceId: new Types.ObjectId(data.serviceId),
      serviceName: data.serviceName,
      serviceStatus: data.serviceStatus,
      symptom: data.symptom,
      signals: data.signals,
      predictions: data.predictions,
      modelInfo: data.modelInfo,
      isAnomaly: data.isAnomaly,
      anomalyScore: data.anomalyScore,
      features: data.features,
      signalCounts: data.signalCounts,
      generatedAt: data.generatedAt,
    });
  }

  async findById(id: string): Promise<PredictionDocument | null> {
    return this.predictionModel.findById(id).exec();
  }

  async findMany(
    filter: Record<string, unknown> = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
  ): Promise<PredictionDocument[]> {
    return this.predictionModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .exec();
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return this.predictionModel.countDocuments(filter).exec();
  }
}
