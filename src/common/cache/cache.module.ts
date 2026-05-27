import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST', '127.0.0.1');
        const port = config.get<number>('REDIS_PORT', 6379);
        const password = config.get<string>('REDIS_PASSWORD', '');
        const useTls = config.get<string>('REDIS_TLS', 'false') === 'true';

        const protocol = useTls ? 'rediss' : 'redis';
        const auth = password ? `:${password}@` : '';
        const url = `${protocol}://${auth}${host}:${port}`;

        return {
          store: createKeyv(url),
          ttl: 60_000, // default 60s — overridden per call
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
