import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AlertSeverity, AlertStatus } from '../../common/enums';

export type AlertDocument = HydratedDocument<Alert>;

@Schema({
  collection: 'alerts',
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
export class Alert {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({
    required: true,
    enum: AlertSeverity,
    default: AlertSeverity.WARNING,
    index: true,
  })
  severity!: AlertSeverity;

  @Prop({
    required: true,
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
    index: true,
  })
  status!: AlertStatus;

  @Prop({ type: Types.ObjectId, ref: 'MonitoredService', required: true, index: true })
  serviceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Incident', default: null })
  incidentId!: Types.ObjectId | null;

  @Prop({ trim: true, default: 'in-app' })
  channel!: string;

  @Prop({ type: Date, required: true, index: true })
  triggeredAt!: Date;

  @Prop({ type: Date, default: null })
  acknowledgedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
AlertSchema.index({ status: 1, triggeredAt: -1 });
