import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DependencyType } from '../../common/enums';

export type DependencyDocument = HydratedDocument<ServiceDependency>;

@Schema({
  collection: 'dependencies',
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
export class ServiceDependency {
  @Prop({ type: Types.ObjectId, ref: 'MonitoredService', required: true, index: true })
  sourceServiceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MonitoredService', required: true, index: true })
  targetServiceId!: Types.ObjectId;

  @Prop({ required: true, enum: DependencyType, index: true })
  type!: DependencyType;

  @Prop({ required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  criticality!: string;

  @Prop({ trim: true, default: '' })
  description!: string;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ServiceDependencySchema =
  SchemaFactory.createForClass(ServiceDependency);
ServiceDependencySchema.index(
  { sourceServiceId: 1, targetServiceId: 1, type: 1 },
  { unique: true },
);
