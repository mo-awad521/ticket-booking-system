import { PaginationQueryDto } from '../dtos/admin.dtos';
import { AdminUserResponseDto } from '../dtos/admin.dtos';
import { AdminEventResponseDto } from '../dtos/admin.dtos';
import { AdminOrderResponseDto } from '../dtos/admin.dtos';
import { AdminTicketResponseDto } from '../dtos/admin.dtos';
import { AdminAuditLogResponseDto } from '../dtos/admin.dtos';
import { AdminSystemStatsDto } from '../dtos/admin.dtos';
import { RevenueByPeriodDto } from '../dtos/admin.dtos';
import { PaginatedResponseDto } from '../dtos/admin.dtos';
import { AuditLogQueryDto } from '../dtos/admin.dtos';
import { AdminEventsQueryDto } from '../services/admin-events.service';
import { AdminTicketsQueryDto } from '../services/admin-tickets.service';

// ─────────────────────────────────────────────────────────────────────────────
// admin/interfaces/admin.interfaces.ts
//
// ISP — Interface Segregation Principle
// ─────────────────────────────────────────────────────────────────────────────

// ── READ Interfaces ───────────────────────────────────────────────────────────

export interface IAdminUserReader {
  findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdminUserResponseDto>>;
  findById(id: string): Promise<AdminUserResponseDto>;
}

export interface IAdminEventReader {
  findAll(
    query: AdminEventsQueryDto,
  ): Promise<PaginatedResponseDto<AdminEventResponseDto>>;
  findById(id: string): Promise<AdminEventResponseDto>;
}

export interface IAdminOrderReader {
  findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdminOrderResponseDto>>;
  findByUser(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdminOrderResponseDto>>;
  findById(id: string): Promise<AdminOrderResponseDto>;
}

export interface IAdminTicketReader {
  findAll(
    query: AdminTicketsQueryDto,
  ): Promise<PaginatedResponseDto<AdminTicketResponseDto>>;
  findById(id: string): Promise<AdminTicketResponseDto>;
}

export interface IAdminStatsReader {
  getSystemStats(): Promise<AdminSystemStatsDto>;
  getRevenueByPeriod(
    period: 'day' | 'week' | 'month',
  ): Promise<RevenueByPeriodDto[]>;
}

export interface IAdminAuditLogReader {
  findAll(
    query: AuditLogQueryDto,
  ): Promise<PaginatedResponseDto<AdminAuditLogResponseDto>>;
}

// ── WRITE Interfaces ──────────────────────────────────────────────────────────

export interface IAdminUserWriter {
  updateStatus(
    userId: string,
    status: string,
    adminId: string,
  ): Promise<AdminUserResponseDto>;
  updateRole(
    userId: string,
    role: string,
    adminId: string,
  ): Promise<AdminUserResponseDto>;
}

export interface IAdminEventWriter {
  forceCancel(
    eventId: string,
    reason: string,
    adminId: string,
  ): Promise<AdminEventResponseDto>;
  cancelAllByOrganizer(organizerId: string, adminId: string): Promise<number>;
}

// ── EXPORT Interface ──────────────────────────────────────────────────────────

export interface IAdminExport {
  exportUsersCsv(query: PaginationQueryDto): Promise<string>;
  exportOrdersCsv(query: PaginationQueryDto): Promise<string>;
}
