import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

export type MetricDocument = HydratedDocument<Metric>;

@Schema({
  collection: 'metrics',
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
export class Metric {
  @Prop({ type: Types.ObjectId, ref: 'MonitoredService', required: true, index: true })
  serviceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, enum: MetricType, default: MetricType.GAUGE })
  type!: MetricType;

  @Prop({ required: true, type: Number })
  value!: number;

  @Prop({ trim: true, default: '' })
  unit!: string;

  @Prop({ type: Object, default: {} })
  labels!: Record<string, string>;

  @Prop({ type: Date, required: true, index: true })
  timestamp!: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const MetricSchema = SchemaFactory.createForClass(Metric);
MetricSchema.index({ serviceId: 1, name: 1, timestamp: -1 });
