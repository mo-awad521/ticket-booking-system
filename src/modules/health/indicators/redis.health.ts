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
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    super();

    const redisUrl = this.config.get<string>('REDIS_URL');

    if (redisUrl) {
      this.client = new Redis(redisUrl, {
        connectTimeout: 3_000,
        commandTimeout: 3_000,

        // IMPORTANT FOR BULLMQ + RENDER
        maxRetriesPerRequest: null,

        enableReadyCheck: false,

        // prevents immediate connection spam on bootstrap
        lazyConnect: true,
      });
    } else {
      const host = this.config.get<string>('REDIS_HOST', '127.0.0.1');
      const port = this.config.get<number>('REDIS_PORT', 6379);
      const password = this.config.get<string>('REDIS_PASSWORD', '');
      const useTls = this.config.get<string>('REDIS_TLS', 'false') === 'true';

      this.client = new Redis({
        host,
        port,
        ...(password ? { password } : {}),
        ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),

        connectTimeout: 3_000,
        commandTimeout: 3_000,

        // IMPORTANT FOR BULLMQ + RENDER
        maxRetriesPerRequest: null,

        enableReadyCheck: false,
        lazyConnect: true,
      });
    }
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // connect only if not connected
      if (this.client.status === 'wait') {
        await this.client.connect();
      }

      const pong = await this.client.ping();

      return this.getStatus(key, pong === 'PONG');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Redis unreachable';

      throw new HealthCheckError(
        message,
        this.getStatus(key, false, { message }),
      );
    }
  }
}
