import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  USABILITY_EVENT_NAMES,
  USABILITY_TASK_IDS,
} from '../interfaces/usability.interface';

export type UsabilityEventDocument = HydratedDocument<UsabilityEvent>;

@Schema({
  collection: 'usability_events',
  timestamps: true,
  versionKey: false,
})
export class UsabilityEvent {
  @Prop({
    required: true,
    type: String,
    enum: USABILITY_EVENT_NAMES,
    index: true,
  })
  eventName!: (typeof USABILITY_EVENT_NAMES)[number];

  @Prop({ type: String, enum: USABILITY_TASK_IDS, index: true })
  taskId?: (typeof USABILITY_TASK_IDS)[number];

  @Prop({ required: true, index: true })
  actorId!: Types.ObjectId;

  @Prop({ required: true, index: true, trim: true })
  sessionId!: string;

  @Prop({ required: true, trim: true })
  routeKey!: string;

  @Prop({ required: true, index: true })
  occurredAt!: Date;

  @Prop()
  durationMs?: number;

  @Prop()
  success?: boolean;

  @Prop()
  errorCategory?: string;

  @Prop({ type: Object, default: {} })
  properties!: Record<string, string | number | boolean>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UsabilityEventSchema =
  SchemaFactory.createForClass(UsabilityEvent);
UsabilityEventSchema.index({ actorId: 1, occurredAt: -1 });
UsabilityEventSchema.index({ eventName: 1, occurredAt: -1 });
UsabilityEventSchema.index(
  { occurredAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);
