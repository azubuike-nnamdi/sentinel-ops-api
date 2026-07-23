import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'SentinelOps',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  url: process.env.APP_URL || 'http://localhost:8000',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: (
    process.env.CORS_ORIGIN ||
    'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,http://localhost:8000,http://127.0.0.1:8000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
  swaggerPath: process.env.SWAGGER_PATH || 'docs',
  logLevel: process.env.LOG_LEVEL || 'info',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
}));
