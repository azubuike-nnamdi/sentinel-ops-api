import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { AnomaliesModule } from '../anomalies/anomalies.module';
import { DependenciesModule } from '../dependencies/dependencies.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { LogsModule } from '../logs/logs.module';
import { MetricsModule } from '../metrics/metrics.module';
import { ServicesModule } from '../services/services.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    ServicesModule,
    IncidentsModule,
    AnomaliesModule,
    AlertsModule,
    LogsModule,
    MetricsModule,
    DependenciesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
