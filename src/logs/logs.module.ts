import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsModule } from '../alerts/alerts.module';
import { ServicesModule } from '../services/services.module';
import { LogsController } from './logs.controller';
import { LogsRepository } from './repositories/logs.repository';
import { LogsService } from './logs.service';
import { LogEntry, LogEntrySchema } from './schemas/log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LogEntry.name, schema: LogEntrySchema }]),
    ServicesModule,
    AlertsModule,
  ],
  controllers: [LogsController],
  providers: [LogsService, LogsRepository],
  exports: [LogsService, LogsRepository],
})
export class LogsModule {}
