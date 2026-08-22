import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsModule } from '../alerts/alerts.module';
import { IncidentsController } from './incidents.controller';
import { IncidentsRepository } from './repositories/incidents.repository';
import { IncidentsService } from './incidents.service';
import { Incident, IncidentSchema } from './schemas/incident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Incident.name, schema: IncidentSchema }]),
    AlertsModule,
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsRepository],
  exports: [IncidentsService, IncidentsRepository],
})
export class IncidentsModule {}
