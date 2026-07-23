import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
  ],
  controllers: [DependenciesController],
  providers: [DependenciesService, DependenciesRepository],
  exports: [DependenciesService, DependenciesRepository],
})
export class DependenciesModule {}
