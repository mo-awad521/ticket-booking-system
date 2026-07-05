import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { Order } from '../orders/entities/order.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { AdminUsersService } from './services/admin-users.service';
import { AdminEventsService } from './services/admin-events.service';
import { AdminOrdersService } from './services/admin-orders.service';
import { AdminStatsService } from './services/admin-stats.service';
import { AdminTicketsService } from './services/admin-tickets.service';
import { AdminAuditLogService } from './services/admin-audit-log.service';
import { AdminExportService } from './services/admin-export.service';
import { AdminFacadeService } from './services/admin-facade.service';
// import {
//   AdminUsersController,
//   AdminEventsController,
//   AdminOrdersController,
//   AdminTicketsController,
//   AdminStatsController,
//   AdminAuditLogController,
// } from './controllers/admin.controller';

// ─────────────────────────────────────────────────────────────────────────────
// admin/admin.module.ts
//
//
//  ScheduleModule  Cron  AdminAuditLogService
// ─────────────────────────────────────────────────────────────────────────────

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User, Event, Order, Ticket, AdminAuditLog]),
  ],

  // controllers: [
  //   AdminUsersController, // /admin/users/*
  //   AdminEventsController, // /admin/events/*
  //   AdminOrdersController, // /admin/orders/*
  //   AdminTicketsController, // /admin/tickets/*
  //   AdminStatsController, // /admin/stats/*
  //   AdminAuditLogController, // /admin/audit-logs/*
  // ],

  providers: [
    // ── Domain Services (SRP) ──────────────────────────────
    AdminUsersService, // User read + write
    AdminEventsService, // Event read + write + cascade
    AdminOrdersService, // Order read only
    AdminStatsService, // Stats + revenue by period
    AdminTicketsService, // Ticket read only
    AdminAuditLogService, // AuditLog read + cron cleanup
    AdminExportService, // CSV export

    // ── Orchestration (Facade Pattern) ─────────────────────
    AdminFacadeService, // Single entry point for all controllers
  ],

  exports: [AdminFacadeService],
})
export class AdminModule {}
