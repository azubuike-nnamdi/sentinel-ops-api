import aiConfig from './ai.config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import otelConfig from './otel.config';
import redisConfig from './redis.config';
import throttlerConfig from './throttler.config';

export const configurations = [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  throttlerConfig,
  otelConfig,
  aiConfig,
];

export {
  aiConfig,
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  throttlerConfig,
  otelConfig,
};
