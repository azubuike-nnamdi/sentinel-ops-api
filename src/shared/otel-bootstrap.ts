import { Logger } from '@nestjs/common';

/**
 * OpenTelemetry bootstrap for SentinelOps.
 * Loaded before NestFactory when OTEL_ENABLED=true.
 */
export async function bootstrapTelemetry(): Promise<void> {
  const enabled = process.env.OTEL_ENABLED === 'true';
  const logger = new Logger('OpenTelemetry');

  if (!enabled) {
    logger.log('OpenTelemetry is disabled');
    return;
  }

  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { getNodeAutoInstrumentations } =
    await import('@opentelemetry/auto-instrumentations-node');
  const { NestInstrumentation } =
    await import('@opentelemetry/instrumentation-nestjs-core');
  const { OTLPTraceExporter } =
    await import('@opentelemetry/exporter-trace-otlp-http');
  const { resourceFromAttributes } = await import('@opentelemetry/resources');
  const { ATTR_SERVICE_NAME } =
    await import('@opentelemetry/semantic-conventions');

  const serviceName = process.env.OTEL_SERVICE_NAME || 'sentinelops-api';
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    'http://localhost:4318/v1/traces';

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    traceExporter: new OTLPTraceExporter({ url: endpoint }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
      new NestInstrumentation(),
    ],
  });

  sdk.start();
  logger.log(`OpenTelemetry started for ${serviceName} → ${endpoint}`);

  const shutdown = async (): Promise<void> => {
    try {
      await sdk.shutdown();
      logger.log('OpenTelemetry shut down');
    } catch (error) {
      logger.error('Error shutting down OpenTelemetry', error as Error);
    }
  };

  process.on('SIGTERM', () => {
    void shutdown();
  });
  process.on('SIGINT', () => {
    void shutdown();
  });
}
