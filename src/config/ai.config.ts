import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8001',
  timeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '10000', 10),
  /** When true, fall back to local heuristic RCA if FastAPI is unreachable */
  fallbackEnabled: process.env.AI_FALLBACK_ENABLED !== 'false',
}));
