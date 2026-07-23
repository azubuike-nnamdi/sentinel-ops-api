import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesController } from './services.controller';
import { ServicesRepository } from './repositories/services.repository';
import { ServicesService } from './services.service';
import {
  MonitoredService,
  MonitoredServiceSchema,
} from './schemas/service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MonitoredService.name, schema: MonitoredServiceSchema },
    ]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService, ServicesRepository, MongooseModule],
})
export class ServicesModule {}
