import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LogLevel } from '../../common/enums';

export type LogDocument = HydratedDocument<LogEntry>;

@Schema({
  collection: 'logs',
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
export class LogEntry {
  @Prop({ type: Types.ObjectId, ref: 'MonitoredService', required: true, index: true })
  serviceId!: Types.ObjectId;

  @Prop({ required: true, enum: LogLevel, index: true })
  level!: LogLevel;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ type: Date, required: true, index: true })
  timestamp!: Date;

  @Prop({ trim: true, index: true })
  traceId?: string;

  @Prop({ trim: true })
  spanId?: string;

  @Prop({ trim: true, default: 'application' })
  source!: string;

  @Prop({ trim: true })
  host?: string;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const LogEntrySchema = SchemaFactory.createForClass(LogEntry);
LogEntrySchema.index({ serviceId: 1, timestamp: -1 });
LogEntrySchema.index({ level: 1, timestamp: -1 });
