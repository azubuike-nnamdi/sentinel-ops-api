import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnomaliesModule } from '../anomalies/anomalies.module';
import { DependenciesModule } from '../dependencies/dependencies.module';
import { LogsModule } from '../logs/logs.module';
import { MetricsModule } from '../metrics/metrics.module';
import { ServicesModule } from '../services/services.module';
import { AlertsModule } from '../alerts/alerts.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PredictionsRepository } from './repositories/predictions.repository';
import { Prediction, PredictionSchema } from './schemas/prediction.schema';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 0,
    }),
    MongooseModule.forFeature([
      { name: Prediction.name, schema: PredictionSchema },
    ]),
    ServicesModule,
    AnomaliesModule,
    DependenciesModule,
    MetricsModule,
    LogsModule,
    AlertsModule,
  ],
  controllers: [AiController],
  providers: [AiService, PredictionsRepository],
  exports: [AiService],
})
export class AiModule {}
