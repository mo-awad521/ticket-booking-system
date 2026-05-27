import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSourceOptions } from './database/data-source';

// ── Feature modules ────────────────────────────────────────────────────────
import { HealthModule } from './modules/health/health.module';
import { AppCacheModule } from './common/cache/cache.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EventsModule } from './modules/events/events.module';
import { TicketTypesModule } from './modules/ticket-types/ticket-types.module';
import { MediaModule } from './modules/media/media.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ── PostgreSQL (Neon) ──────────────────────────────────────────────────
    TypeOrmModule.forRoot(dataSourceOptions),

    // ── BullMQ — Redis queue ───────────────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST', '127.0.0.1');
        const port = config.get<number>('REDIS_PORT', 6379);
        const password = config.get<string>('REDIS_PASSWORD', '');
        const useTls = config.get<string>('REDIS_TLS', 'false') === 'true';

        return {
          connection: {
            host,
            port,
            ...(password.length > 0 ? { password } : {}),
            ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
            retryStrategy: (times: number) => Math.min(times * 500, 5_000),
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          },
          defaultJobOptions: {
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 200 },
          },
        };
      },
    }),

    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'email_queue',
      adapter: BullMQAdapter,
    }),

    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),

    ThrottlerModule.forRoot([
      { name: 'auth', ttl: 60_000, limit: 5 },
      { name: 'strict', ttl: 3_600_000, limit: 3 },
      { name: 'default', ttl: 60_000, limit: 100 },
    ]),

    // ── Infrastructure ────────────────────────────────────────────────────
    HealthModule, // GET /health, /health/live, /health/ready
    AppCacheModule, // global Redis cache (CacheService injected anywhere)

    // ── Domain modules ────────────────────────────────────────────────────
    UsersModule,
    AuthModule,
    NotificationsModule,
    EventsModule,
    TicketTypesModule,
    MediaModule,
    ReservationsModule,
    OrdersModule,
    PaymentsModule,
    TicketsModule,
    AnalyticsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
