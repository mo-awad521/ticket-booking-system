import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, FindOptionsWhere } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';
import { IAdminAuditLogReader } from '../interfaces/admin.interfaces';
import {
  AdminAuditLogResponseDto,
  AuditLogQueryDto,
  PaginatedResponseDto,
} from '../dtos/admin.dtos';

// ─────────────────────────────────────────────────────────────────────────────
// admin/services/admin-audit-log.service.ts — NEW
//
// مسؤوليتان:
//   1. قراءة الـ audit logs مع فلترة متعددة
//   2. Cron: حذف logs أقدم من 90 يوماً تلقائياً
// ─────────────────────────────────────────────────────────────────────────────

const AUDIT_RETENTION_DAYS = 90;

@Injectable()
export class AdminAuditLogService implements IAdminAuditLogReader {
  private readonly logger = new Logger(AdminAuditLogService.name);

  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly auditRepo: Repository<AdminAuditLog>,
  ) {}

  // ── READ ──────────────────────────────────────────────────────────────────

  async findAll(
    query: AuditLogQueryDto,
  ): Promise<PaginatedResponseDto<AdminAuditLogResponseDto>> {
    const {
      page,
      limit,
      adminId,
      action,
      resource,
      success,
      dateFrom,
      dateTo,
    } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<AdminAuditLog> = {};

    if (adminId !== undefined) where.adminId = adminId;
    if (action !== undefined) where.action = action;
    if (resource !== undefined) where.resource = resource;
    if (success !== undefined) where.success = success;
    console.log(query);

    const qb = this.auditRepo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (adminId) qb.andWhere('a.adminId = :adminId', { adminId });
    if (action) qb.andWhere('a.action   = :action', { action });
    if (resource) qb.andWhere('a.resource = :resource', { resource });
    if (success !== undefined) qb.andWhere('a.success = :success', { success });
    if (dateFrom)
      qb.andWhere('a.created_at >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    if (dateTo)
      qb.andWhere('a.createdAt <= :dateTo', { dateTo: new Date(dateTo) });

    const [logs, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(
      logs.map((l) => new AdminAuditLogResponseDto(l)),
      total,
      page,
      limit,
    );
  }

  // ── Cron Cleanup ──────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - AUDIT_RETENTION_DAYS);

    const result = await this.auditRepo.delete({
      createdAt: LessThan(cutoff),
    });

    this.logger.log(
      `[AuditCleanup] Deleted ${result.affected ?? 0} logs older than ${AUDIT_RETENTION_DAYS} days`,
    );
  }
}
