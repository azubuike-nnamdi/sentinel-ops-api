import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('database.uri'),
        serverSelectionTimeoutMS: 5_000,
        connectTimeoutMS: 5_000,
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
