import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AnomalyStatus } from '../../common/enums';

export type AnomalyDocument = HydratedDocument<Anomaly>;

@Schema({
  collection: 'anomalies',
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
export class Anomaly {
  @Prop({ type: Types.ObjectId, ref: 'MonitoredService', required: true, index: true })
  serviceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  metricName!: string;

  @Prop({ required: true, type: Number, min: 0, max: 1 })
  score!: number;

  @Prop({
    required: true,
    enum: AnomalyStatus,
    default: AnomalyStatus.DETECTED,
    index: true,
  })
  status!: AnomalyStatus;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ type: Date, required: true, index: true })
  detectedAt!: Date;

  @Prop({ type: Object, default: {} })
  evidence!: Record<string, unknown>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AnomalySchema = SchemaFactory.createForClass(Anomaly);
AnomalySchema.index({ serviceId: 1, detectedAt: -1 });
