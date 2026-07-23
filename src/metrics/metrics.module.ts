import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from '../services/services.module';
import { MetricsController } from './metrics.controller';
import { MetricsRepository } from './repositories/metrics.repository';
import { MetricsService } from './metrics.service';
import { Metric, MetricSchema } from './schemas/metric.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Metric.name, schema: MetricSchema }]),
    ServicesModule,
  ],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsRepository],
  exports: [MetricsService, MetricsRepository],
})
export class MetricsModule {}
