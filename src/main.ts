import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { bootstrapTelemetry } from './shared/otel-bootstrap';
import { APP_CONSTANTS } from './common/constants';

async function bootstrap(): Promise<void> {
  await bootstrapTelemetry();

  console.log('[Bootstrap] Creating Nest application...');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    abortOnError: true,
  });
  console.log('[Bootstrap] Nest application created');

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  const port = configService.get<number>('app.port') || 8000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const corsOrigins = configService.get<string[]>('app.corsOrigin') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ];

  app.use(
    helmet({
      // Keep Swagger UI fetch/assets working in the browser
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  const compress =
    typeof compression === 'function'
      ? compression
      : (compression as { default: typeof compression }).default;
  app.use(compress());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'Accept'],
  });

  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  if (configService.get<boolean>('app.swaggerEnabled')) {
    const swaggerPath = configService.get<string>('app.swaggerPath') || 'docs';

    const swaggerConfig = new DocumentBuilder()
      .setTitle(APP_CONSTANTS.APP_NAME)
      .setDescription(
        'AI-Based Incident Detection and Automated Root Cause Analysis Platform for Distributed Enterprise Applications',
      )
      .setVersion(APP_CONSTANTS.API_VERSION)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token',
        },
        'JWT',
      )
      .addTag('Health', 'Liveness and readiness probes')
      .addTag('Auth', 'Authentication and authorization')
      .addTag('Users', 'User management')
      .addTag('Services', 'Monitored distributed services')
      .addTag('Logs', 'Centralized application logs')
      .addTag('Metrics', 'Service performance metrics')
      .addTag('Anomalies', 'Detected anomalies')
      .addTag('Incidents', 'Incident lifecycle management')
      .addTag('Alerts', 'Alerting and notifications')
      .addTag('Dependencies', 'Service dependency graph')
      .addTag('Dashboard', 'Operational dashboards')
      .addTag('Telemetry', 'Telemetry ingestion')
      .addTag('AI', 'AI-assisted root cause analysis')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`Swagger docs available at /${swaggerPath}`, 'Bootstrap');
  }

  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(
    `${APP_CONSTANTS.APP_NAME} listening on port ${port} (${apiPrefix})`,
    'Bootstrap',
  );
}

void bootstrap();
