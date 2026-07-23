import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IncidentSeverity, IncidentStatus } from '../../common/enums';

export type IncidentDocument = HydratedDocument<Incident>;

@Schema({
  collection: 'incidents',
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
export class Incident {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({
    required: true,
    enum: IncidentSeverity,
    default: IncidentSeverity.MEDIUM,
    index: true,
  })
  severity!: IncidentSeverity;

  @Prop({
    required: true,
    enum: IncidentStatus,
    default: IncidentStatus.OPEN,
    index: true,
  })
  status!: IncidentStatus;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'MonitoredService' }], default: [] })
  serviceIds!: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Anomaly' }], default: [] })
  anomalyIds!: Types.ObjectId[];

  @Prop({ trim: true, default: '' })
  rootCause!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  resolvedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
IncidentSchema.index({ status: 1, severity: 1, createdAt: -1 });
