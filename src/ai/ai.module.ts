import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AnomaliesModule } from '../anomalies/anomalies.module';
import { DependenciesModule } from '../dependencies/dependencies.module';
import { MetricsModule } from '../metrics/metrics.module';
import { ServicesModule } from '../services/services.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 0,
    }),
    ServicesModule,
    AnomaliesModule,
    DependenciesModule,
    MetricsModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
