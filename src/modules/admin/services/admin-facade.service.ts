import { Injectable, Logger } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import {
  AdminEventsService,
  AdminEventsQueryDto,
} from './admin-events.service';
import { AdminOrdersService } from './admin-orders.service';
import { AdminStatsService } from './admin-stats.service';
import {
  AdminTicketsService,
  AdminTicketsQueryDto,
} from './admin-tickets.service';
import { AdminAuditLogService } from './admin-audit-log.service';
import { AdminExportService } from './admin-export.service';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AccountStatus } from '../../users/enums/account-status.enum';
import {
  AuditLogQueryDto,
  AdminAuditLogResponseDto,
  AdminEventResponseDto,
  AdminOrderResponseDto,
  AdminSystemStatsDto,
  AdminTicketResponseDto,
  AdminUserResponseDto,
  PaginatedResponseDto,
  PaginationQueryDto,
  RevenueByPeriodDto,
} from '../dtos/admin.dtos';

// ─────────────────────────────────────────────────────────────────────────────
// admin/services/admin-facade.service.ts
//
// Design Pattern: Facade

@Injectable()
export class AdminFacadeService {
  private readonly logger = new Logger(AdminFacadeService.name);

  constructor(
    private readonly usersService: AdminUsersService,
    private readonly eventsService: AdminEventsService,
    private readonly ordersService: AdminOrdersService,
    private readonly statsService: AdminStatsService,
    private readonly ticketsService: AdminTicketsService,
    private readonly auditService: AdminAuditLogService,
    private readonly exportService: AdminExportService,
  ) {}

  // ── Users ─────────────────────────────────────────────────────────────────

  getUsers(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdminUserResponseDto>> {
    return this.usersService.findAll(query);
  }

  getUserById(id: string): Promise<AdminUserResponseDto> {
    return this.usersService.findById(id);
  }

  updateUserStatus(
    userId: string,
    status: AccountStatus,
    adminId: string,
  ): Promise<AdminUserResponseDto> {
    return this.usersService.updateStatus(userId, status, adminId);
  }

  async suspendUser(
    userId: string,
    adminId: string,
  ): Promise<AdminUserResponseDto> {
    const user = await this.usersService.updateStatus(
      userId,
      AccountStatus.SUSPENDED,
      adminId,
    );

    if (user.role === UserRole.ORGANIZER) {
      const cancelled = await this.eventsService.cancelAllByOrganizer(
        userId,
        adminId,
      );
      this.logger.log(
        `[Cascade] Suspended organizer ${userId} — cancelled ${cancelled} event(s)`,
      );
    }

    return user;
  }

  activateUser(userId: string, adminId: string): Promise<AdminUserResponseDto> {
    return this.usersService.updateStatus(
      userId,
      AccountStatus.ACTIVE,
      adminId,
    );
  }

  updateUserRole(
    userId: string,
    role: UserRole,
    adminId: string,
  ): Promise<AdminUserResponseDto> {
    return this.usersService.updateRole(userId, role, adminId);
  }

  getUserOrders(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdminOrderResponseDto>> {
    return this.ordersService.findByUser(userId, query);
  }

  // ── Events ────────────────────────────────────────────────────────────────

  getEvents(
    query: AdminEventsQueryDto,
  ): Promise<PaginatedResponseDto<AdminEventResponseDto>> {
    return this.eventsService.findAll(query);
  }

  getEventById(id: string): Promise<AdminEventResponseDto> {
    return this.eventsService.findById(id);
  }

  forceCancelEvent(
    eventId: string,
    reason: string,
    adminId: string,
  ): Promise<AdminEventResponseDto> {
    return this.eventsService.forceCancel(eventId, reason, adminId);
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  getOrders(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdminOrderResponseDto>> {
    return this.ordersService.findAll(query);
  }

  getOrderById(id: string): Promise<AdminOrderResponseDto> {
    return this.ordersService.findById(id);
  }

  // ── Tickets ───────────────────────────────────────────────────────────────

  getTickets(
    query: AdminTicketsQueryDto,
  ): Promise<PaginatedResponseDto<AdminTicketResponseDto>> {
    return this.ticketsService.findAll(query);
  }

  getTicketById(id: string): Promise<AdminTicketResponseDto> {
    return this.ticketsService.findById(id);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getSystemStats(): Promise<AdminSystemStatsDto> {
    return this.statsService.getSystemStats();
  }

  getRevenueByPeriod(
    period: 'day' | 'week' | 'month',
  ): Promise<RevenueByPeriodDto[]> {
    return this.statsService.getRevenueByPeriod(period);
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────

  getAuditLogs(
    query: AuditLogQueryDto,
  ): Promise<PaginatedResponseDto<AdminAuditLogResponseDto>> {
    return this.auditService.findAll(query);
  }

  // ── Export ────────────────────────────────────────────────────────────────

  exportUsersCsv(query: PaginationQueryDto): Promise<string> {
    return this.exportService.exportUsersCsv(query);
  }

  exportOrdersCsv(query: PaginationQueryDto): Promise<string> {
    return this.exportService.exportOrdersCsv(query);
  }
}
