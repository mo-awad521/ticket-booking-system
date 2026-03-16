import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Ticket } from '../tickets/entities/ticket.entity';
import { EventAnalyticsService } from './services/event-analytics.service';
import { EventAnalyticsGateway } from './gateways/event-analytics.gateway';
import { AnalyticsListener } from './listeners/analytics.listener';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),

    TypeOrmModule.forFeature([Ticket]),
  ],

  providers: [
    EventAnalyticsService,
    EventAnalyticsGateway,
    AnalyticsListener,
    WsJwtGuard,
  ],

  exports: [EventAnalyticsService],
})
export class AnalyticsModule {}
