import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UsabilitySurveyDocument = HydratedDocument<UsabilitySurvey>;

@Schema({
  collection: 'usability_surveys',
  timestamps: true,
  versionKey: false,
})
export class UsabilitySurvey {
  @Prop({ required: true, index: true })
  actorId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  studySessionId!: string;

  @Prop({ type: [Number], required: true })
  answers!: number[];

  @Prop({ required: true, min: 0, max: 100 })
  score!: number;

  @Prop({ trim: true, maxlength: 1000 })
  feedback?: string;

  @Prop({ required: true, index: true })
  submittedAt!: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UsabilitySurveySchema =
  SchemaFactory.createForClass(UsabilitySurvey);
UsabilitySurveySchema.index(
  { submittedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);
