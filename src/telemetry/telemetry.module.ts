import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { LogsModule } from '../logs/logs.module';
import { MetricsModule } from '../metrics/metrics.module';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [LogsModule, MetricsModule, AlertsModule],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
