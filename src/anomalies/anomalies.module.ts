import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from '../services/services.module';
import { AnomaliesController } from './anomalies.controller';
import { AnomaliesRepository } from './repositories/anomalies.repository';
import { AnomaliesService } from './anomalies.service';
import { Anomaly, AnomalySchema } from './schemas/anomaly.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Anomaly.name, schema: AnomalySchema }]),
    ServicesModule,
  ],
  controllers: [AnomaliesController],
  providers: [AnomaliesService, AnomaliesRepository],
  exports: [AnomaliesService, AnomaliesRepository],
})
export class AnomaliesModule {}
