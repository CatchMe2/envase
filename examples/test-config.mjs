import { z } from 'zod';
import { envvar } from '../src/index.ts';

export default {
  app: {
    nodeEnv: envvar('NODE_ENV', z.enum(['production', 'test', 'development'])),
    appVersion: envvar('APP_VERSION', z.string().default('unknown')),
    listen: {
      port: envvar(
        'PORT',
        z.coerce
          .number()
          .int()
          .min(1024)
          .max(65535)
          .describe('Application listening port'),
      ),
      host: envvar(
        'HOST',
        z.string().default('0.0.0.0').describe('Bind host address'),
      ),
    },
  },
  database: {
    url: envvar(
      'DATABASE_URL',
      z.string().url().describe('PostgreSQL connection URL'),
    ),
    poolSize: envvar(
      'DB_POOL_SIZE',
      z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10)
        .describe('Database connection pool size'),
    ),
  },
  api: {
    key: envvar(
      'API_KEY',
      z.string().min(32).describe('Third-party API authentication key'),
    ),
  },
};
