import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from '../services/services.module';
import { DependenciesController } from './dependencies.controller';
import { DependenciesRepository } from './repositories/dependencies.repository';
import { DependenciesService } from './dependencies.service';
import {
  ServiceDependency,
  ServiceDependencySchema,
} from './schemas/dependency.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceDependency.name, schema: ServiceDependencySchema },
    ]),
    ServicesModule,
  ],
  controllers: [DependenciesController],
  providers: [DependenciesService, DependenciesRepository],
  exports: [DependenciesService, DependenciesRepository],
})
export class DependenciesModule {}
