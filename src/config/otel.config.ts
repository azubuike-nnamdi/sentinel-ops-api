import { registerAs } from '@nestjs/config';

export default registerAs('otel', () => ({
  enabled: process.env.OTEL_ENABLED === 'true',
  serviceName: process.env.OTEL_SERVICE_NAME || 'sentinelops-api',
  endpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    'http://localhost:4318/v1/traces',
}));
