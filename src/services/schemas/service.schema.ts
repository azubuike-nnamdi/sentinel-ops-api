import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ServiceStatus } from '../../common/enums';

export type ServiceDocument = HydratedDocument<MonitoredService>;

@Schema({
  collection: 'services',
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
export class MonitoredService {
  @Prop({ required: true, trim: true, unique: true, index: true })
  name!: string;

  @Prop({ required: true, trim: true, unique: true, lowercase: true })
  slug!: string;

  @Prop({ trim: true, default: '' })
  description!: string;

  @Prop({ required: true, trim: true })
  owner!: string;

  @Prop({ required: true, trim: true, index: true })
  environment!: string;

  @Prop({
    required: true,
    enum: ServiceStatus,
    default: ServiceStatus.UNKNOWN,
    index: true,
  })
  status!: ServiceStatus;

  @Prop({ type: [String], default: [] })
  endpoints!: string[];

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const MonitoredServiceSchema =
  SchemaFactory.createForClass(MonitoredService);
