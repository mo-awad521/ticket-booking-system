import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { Order } from '../../orders/entities/order.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AccountStatus } from '../../users/enums/account-status.enum';
import { OrderStatus } from '../../orders/enums/order-status.enum';
import { TicketStatus } from '../../tickets/enums/ticket-status.enum';

// ─────────────────────────────────────────────────────────────────────────────
// admin/dtos/admin.dtos.ts — SRP
// ─────────────────────────────────────────────────────────────────────────────

// ── Pagination ────────────────────────────────────────────────────────────────

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}

// ── User DTOs ─────────────────────────────────────────────────────────────────

export class AdminUserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  isEmailVerified: boolean;
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.accountStatus = user.accountStatus;
    this.isEmailVerified = user.isEmailVerified;
    this.createdAt = user.createdAt;
  }
}

export class UpdateUserStatusDto {
  @IsEnum(AccountStatus)
  @IsNotEmpty()
  status: AccountStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}

// ── Event DTOs ────────────────────────────────────────────────────────────────

export class AdminEventResponseDto {
  id: string;
  title: string;
  status: string;
  location: string;
  startDate: Date;
  endDate: Date;
  organizerId: string;
  createdAt: Date;

  constructor(event: Event) {
    this.id = event.id;
    this.title = event.title;
    this.status = event.status;
    this.location = event.location;
    this.startDate = event.startDate;
    this.endDate = event.endDate;
    this.organizerId = event.organizerId;
    this.createdAt = event.createdAt;
  }
}

export class ForceCancelEventDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

// ── Order DTOs ────────────────────────────────────────────────────────────────

export class AdminOrderResponseDto {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  expiresAt: Date;
  createdAt: Date;

  constructor(order: Order) {
    this.id = order.id;
    this.userId = order.userId;
    this.status = order.status;
    this.totalAmount = order.totalAmount;
    this.currency = order.currency;
    this.expiresAt = order.expiresAt;
    this.createdAt = order.createdAt;
  }
}

// ── Ticket DTOs ───────────────────────────────────────────────────────────────

export class AdminTicketResponseDto {
  id: string;
  code: string;
  status: TicketStatus;
  eventId: string;
  userId: string;
  ticketTypeName: string;
  usedAt: Date | null;
  createdAt: Date;

  constructor(ticket: Ticket) {
    this.id = ticket.id;
    this.code = ticket.code;
    this.status = ticket.status;
    this.eventId = ticket.eventId;
    this.userId =
      (ticket as unknown as { order?: { userId?: string } }).order?.userId ??
      '';
    this.ticketTypeName = ticket.ticketType?.name ?? '';
    this.usedAt = ticket.usedAt ?? null;
    this.createdAt = ticket.createdAt;
  }
}

// ── Stats DTOs ────────────────────────────────────────────────────────────────

export class AdminSystemStatsDto {
  users: {
    total: number;
    active: number;
    suspended: number;
    byRole: Record<string, number>;
  };
  events: {
    total: number;
    published: number;
    draft: number;
    cancelled: number;
  };
  orders: {
    total: number;
    paid: number;
    pending: number;
    expired: number;
    revenue: number;
  };
  tickets: {
    total: number;
    used: number;
    valid: number;
    cancelled: number;
  };
  generatedAt: Date;
}

export class RevenueByPeriodDto {
  date: string;
  revenue: number;
  orders: number;
}

// ── Audit Log DTOs ────────────────────────────────────────────────────────────

export class AdminAuditLogResponseDto {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  success: boolean;
  errorMsg: string | null;
  durationMs: number;
  createdAt: Date;

  constructor(log: AdminAuditLog) {
    this.id = log.id;
    this.adminId = log.adminId;
    this.action = log.action;
    this.resource = log.resource;
    this.resourceId = log.resourceId;
    this.success = log.success;
    this.errorMsg = log.errorMsg;
    this.durationMs = log.durationMs;
    this.createdAt = log.createdAt;
  }
}

export class AuditLogQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  adminId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ obj, key, value }) => {
    if (String(obj[key]) === 'false') return false;
    if (String(obj[key]) === 'true') return true;
    return value as boolean;
  })
  success?: boolean;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
