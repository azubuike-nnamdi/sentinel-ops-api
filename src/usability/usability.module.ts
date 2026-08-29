import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsabilityController } from './usability.controller';
import { UsabilityService } from './usability.service';
import { UsabilityEventsRepository } from './repositories/usability-events.repository';
import {
  UsabilityEvent,
  UsabilityEventSchema,
} from './schemas/usability-event.schema';
import {
  UsabilitySurvey,
  UsabilitySurveySchema,
} from './schemas/usability-survey.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsabilityEvent.name, schema: UsabilityEventSchema },
      { name: UsabilitySurvey.name, schema: UsabilitySurveySchema },
    ]),
  ],
  controllers: [UsabilityController],
  providers: [UsabilityService, UsabilityEventsRepository],
  exports: [UsabilityService],
})
export class UsabilityModule {}
