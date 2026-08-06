import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PredictionDocument = HydratedDocument<Prediction>;

@Schema({
  collection: 'predictions',
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  },
})
export class Prediction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true, index: true })
  serviceId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  serviceName!: string;

  @Prop({ required: true })
  serviceStatus!: string;

  @Prop({ required: true, trim: true })
  symptom!: string;

  @Prop({ type: [String], default: [] })
  signals!: string[];

  @Prop({ type: [Object], default: [] })
  predictions!: Array<{
    type: string;
    confidence: number;
    summary: string;
    evidenceId: string;
    metricName?: string;
  }>;

  @Prop({ type: Object, required: true })
  modelInfo!: {
    name: string;
    mode: string;
  };

  @Prop({ type: Boolean, default: null })
  isAnomaly!: boolean | null;

  @Prop({ type: Number, default: null })
  anomalyScore!: number | null;

  @Prop({ type: Object, default: {} })
  features!: Record<string, number>;

  @Prop({ type: Object, default: {} })
  signalCounts!: {
    anomalies: number;
    metrics: number;
    dependencies: number;
  };

  @Prop({ required: true })
  generatedAt!: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PredictionSchema = SchemaFactory.createForClass(Prediction);

PredictionSchema.index({ createdBy: 1, createdAt: -1 });
PredictionSchema.index({ serviceId: 1, createdAt: -1 });
