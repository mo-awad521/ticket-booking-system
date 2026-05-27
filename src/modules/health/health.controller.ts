import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  /**
   * GET /health
   * Used by Render uptime checks and monitoring tools.
   * Returns 200 when all checks pass, 503 when any critical check fails.
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // ── PostgreSQL (Neon) ────────────────────────────────────────────────
      () => this.db.pingCheck('database', { timeout: 5_000 }),

      // ── Redis (BullMQ queue) ─────────────────────────────────────────────
      () => this.redis.isHealthy('redis'),

      // ── Process memory — warn when heap > 300 MB ────────────────────────
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // ── Disk — warn when usage > 90% ────────────────────────────────────
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  /**
   * GET /health/live
   * Lightweight liveness probe — just confirms process is running.
   * Use this for Render's "Health Check Path" to avoid DB cold-start issues.
   */
  @Get('live')
  live(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /health/ready
   * Readiness probe — confirms all dependencies are reachable.
   * Use for Kubernetes readiness checks or detailed monitoring.
   */
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 5_000 }),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
