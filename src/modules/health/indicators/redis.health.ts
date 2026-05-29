import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const redisUrl = this.config.get<string>('REDIS_URL');
    let client: Redis;

    if (redisUrl) {
      client = new Redis(redisUrl, {
        connectTimeout: 3_000,
        commandTimeout: 3_000,
        maxRetriesPerRequest: 0,
        enableReadyCheck: false,
        lazyConnect: true,
      });
    } else {
      const host = this.config.get<string>('REDIS_HOST', '127.0.0.1');
      const port = this.config.get<number>('REDIS_PORT', 6379);
      const password = this.config.get<string>('REDIS_PASSWORD', '');
      const useTls = this.config.get<string>('REDIS_TLS', 'false') === 'true';

      client = new Redis({
        host,
        port,
        ...(password ? { password } : {}),
        ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
        connectTimeout: 3_000,
        commandTimeout: 3_000,
        maxRetriesPerRequest: 0,
        enableReadyCheck: false,
        lazyConnect: true,
      });
    }

    try {
      await client.connect();
      const pong = await client.ping();
      await client.quit();
      return this.getStatus(key, pong === 'PONG');
    } catch (err) {
      await client.quit().catch(() => {});
      const message = err instanceof Error ? err.message : 'Redis unreachable';
      throw new HealthCheckError(
        message,
        this.getStatus(key, false, { message }),
      );
    }
  }
}
