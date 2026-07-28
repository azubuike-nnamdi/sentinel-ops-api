import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { AiModule } from './ai/ai.module';
import { AlertsModule } from './alerts/alerts.module';
import { AnomaliesModule } from './anomalies/anomalies.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { HealthController } from './common/health.controller';
import { configurations } from './config';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { DependenciesModule } from './dependencies/dependencies.module';
import { IncidentsModule } from './incidents/incidents.module';
import { LogsModule } from './logs/logs.module';
import { MetricsModule } from './metrics/metrics.module';
import { ServicesModule } from './services/services.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
      envFilePath: ['.env.local', '.env'],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('app.nodeEnv') === 'production';

        return {
          pinoHttp: {
            level: configService.get<string>('app.logLevel') || 'info',
            genReqId: (req, res) => {
              const existing = req.headers['x-request-id'];
              const id =
                typeof existing === 'string' && existing.length > 0
                  ? existing
                  : randomUUID();
              res.setHeader('x-request-id', id);
              return id;
            },
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'SYS:standard',
                  },
                },
            serializers: {
              req: (req: { id?: string; method?: string; url?: string }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
            },
            // Defense-in-depth: never leak session/auth material if serializers widen later.
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["set-cookie"]',
                'req.headers["x-api-key"]',
                '*.password',
                '*.accessToken',
                '*.refreshToken',
                '*.token',
                '*.jwt',
                '*.authorization',
              ],
              censor: '[REDACTED]',
            },
            customProps: () => ({
              context: 'HTTP',
            }),
            autoLogging: true,
          },
        };
      },
    }),
    DatabaseModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttler.ttl') || 60_000,
          limit: configService.get<number>('throttler.limit') || 100,
        },
      ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host') || 'localhost',
          port: configService.get<number>('redis.port') || 6379,
          password: configService.get<string>('redis.password') || undefined,
          db: configService.get<number>('redis.db') || 0,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          connectTimeout: 5_000,
        },
      }),
    }),
    CommonModule,
    UsersModule,
    AuthModule,
    ServicesModule,
    LogsModule,
    MetricsModule,
    AnomaliesModule,
    IncidentsModule,
    AlertsModule,
    DependenciesModule,
    DashboardModule,
    TelemetryModule,
    AiModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
