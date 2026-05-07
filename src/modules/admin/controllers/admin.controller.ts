import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AdminFacadeService } from '../services/admin-facade.service';
import { AdminEventsQueryDto } from '../services/admin-events.service';
import { AdminTicketsQueryDto } from '../services/admin-tickets.service';
import {
  AuditLogQueryDto,
  ForceCancelEventDto,
  PaginationQueryDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from '../dtos/admin.dtos';

// ─────────────────────────────────────────────────────────────────────────────
// Shared setup — DRY
// ─────────────────────────────────────────────────────────────────────────────
const AdminGuards = () => UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard);
const AdminRole = () => Roles(UserRole.ADMIN);

const WriteLimit = () => Throttle({ default: { limit: 20, ttl: 60_000 } });

// ══════════════════════════════════════════════════════════════════════════════
// AdminUsersController — /admin/users/*
// ══════════════════════════════════════════════════════════════════════════════
@AdminGuards()
@AdminRole()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly facade: AdminFacadeService) {}

  // GET /admin/users?page=1&limit=20&search=name
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.facade.getUsers(query);
  }

  // GET /admin/users/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.facade.getUserById(id);
  }

  // GET /admin/users/:id/orders
  @Get(':id/orders')
  getUserOrders(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.facade.getUserOrders(id, query);
  }

  // PATCH /admin/users/:id/status
  @WriteLimit()
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.facade.updateUserStatus(userId, dto.status, adminId);
  }

  // PATCH /admin/users/:id/role
  @WriteLimit()
  @Patch(':id/role')
  updateRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.facade.updateUserRole(userId, dto.role, adminId);
  }

  // POST /admin/users/:id/suspend — Rate limited + Cascade
  @WriteLimit()
  @Post(':id/suspend')
  suspend(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.facade.suspendUser(userId, adminId);
  }

  // POST /admin/users/:id/activate
  @WriteLimit()
  @Post(':id/activate')
  activate(
    @Param('id', ParseUUIDPipe) userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.facade.activateUser(userId, adminId);
  }

  // GET /admin/users/export/csv — Export
  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="users.csv"')
  async exportCsv(@Query() query: PaginationQueryDto, @Res() res: Response) {
    const csv = await this.facade.exportUsersCsv(query);
    res.send(csv);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AdminEventsController — /admin/events/*
// ══════════════════════════════════════════════════════════════════════════════
@AdminGuards()
@AdminRole()
@Controller('admin/events')
export class AdminEventsController {
  constructor(private readonly facade: AdminFacadeService) {}

  // GET /admin/events?page=1&status=PUBLISHED&organizerId=uuid
  @Get()
  findAll(@Query() query: AdminEventsQueryDto) {
    return this.facade.getEvents(query);
  }

  // GET /admin/events/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.facade.getEventById(id);
  }

  // POST /admin/events/:id/force-cancel —  Rate limited
  @WriteLimit()
  @Post(':id/force-cancel')
  forceCancel(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: ForceCancelEventDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.facade.forceCancelEvent(eventId, dto.reason, adminId);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AdminOrdersController — /admin/orders/*
// ══════════════════════════════════════════════════════════════════════════════
@AdminGuards()
@AdminRole()
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly facade: AdminFacadeService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.facade.getOrders(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.facade.getOrderById(id);
  }

  // GET /admin/orders/export/csv
  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="orders.csv"')
  async exportCsv(@Query() query: PaginationQueryDto, @Res() res: Response) {
    const csv = await this.facade.exportOrdersCsv(query);
    res.send(csv);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AdminTicketsController — /admin/tickets/*
// ══════════════════════════════════════════════════════════════════════════════
@AdminGuards()
@AdminRole()
@Controller('admin/tickets')
export class AdminTicketsController {
  constructor(private readonly facade: AdminFacadeService) {}

  // GET /admin/tickets?eventId=uuid&status=valid&search=code
  @Get()
  findAll(@Query() query: AdminTicketsQueryDto) {
    return this.facade.getTickets(query);
  }

  // GET /admin/tickets/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.facade.getTicketById(id);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AdminStatsController — /admin/stats/*
// ══════════════════════════════════════════════════════════════════════════════
@AdminGuards()
@AdminRole()
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly facade: AdminFacadeService) {}

  // GET /admin/stats
  @Get()
  getSystemStats() {
    return this.facade.getSystemStats();
  }

  // GET /admin/stats/revenue?period=month
  @Get('revenue')
  getRevenue(@Query('period') period: 'day' | 'week' | 'month' = 'month') {
    return this.facade.getRevenueByPeriod(period);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AdminAuditLogController — /admin/audit-logs/*
// ══════════════════════════════════════════════════════════════════════════════
@AdminGuards()
@AdminRole()
@Controller('admin/audit-logs')
export class AdminAuditLogController {
  constructor(private readonly facade: AdminFacadeService) {}

  // GET /admin/audit-logs?adminId=&action=&resource=&success=true&dateFrom=&dateTo=
  @Get()
  findAll(@Query() query: AuditLogQueryDto) {
    return this.facade.getAuditLogs(query);
  }
}
