import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  // ── Core ──────────────────────────────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    try {
      return (await this.cache.get<T>(key)) ?? null;
    } catch (err) {
      this.logger.warn(`Cache GET failed for key "${key}": ${String(err)}`);
      return null; // graceful degradation — never block on cache miss
    }
  }

  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttlMs);
    } catch (err) {
      this.logger.warn(`Cache SET failed for key "${key}": ${String(err)}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (err) {
      this.logger.warn(`Cache DEL failed for key "${key}": ${String(err)}`);
    }
  }

  /**
   * Delete all keys that start with a given prefix.
   * e.g. invalidate all pages of a paginated list:
   *   await cacheService.delByPrefix('events:public:')
   */
  async delByPrefix(prefix: string): Promise<void> {
    try {
      const store = (
        this.cache as unknown as {
          store?: { keys?: (p: string) => Promise<string[]> };
        }
      ).store;
      if (store?.keys) {
        const keys = await store.keys(`${prefix}*`);
        await Promise.all(keys.map((k) => this.cache.del(k)));
        this.logger.debug(
          `Invalidated ${keys.length} cache keys with prefix "${prefix}"`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Cache prefix DEL failed for "${prefix}": ${String(err)}`,
      );
    }
  }

  /**
   * Wrap an async function with cache-aside logic.
   * If cache hit → return cached value.
   * If cache miss → execute fn, store result, return it.
   *
   * Usage:
   *   return this.cacheService.wrap('events:public:p1', () => this.fetchEvents(), 60_000);
   */
  async wrap<T>(key: string, fn: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache HIT: ${key}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${key}`);
    const result = await fn();
    await this.set(key, result, ttlMs);
    return result;
  }
}
