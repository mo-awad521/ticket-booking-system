import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { IAdminExport } from '../interfaces/admin.interfaces';
import { PaginationQueryDto } from '../dtos/admin.dtos';

@Injectable()
export class AdminExportService implements IAdminExport {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  // ── Users CSV ─────────────────────────────────────────────────────────────

  async exportUsersCsv(query: PaginationQueryDto): Promise<string> {
    const { page, limit } = query;

    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: [
        'id',
        'name',
        'email',
        'role',
        'accountStatus',
        'isEmailVerified',
        'createdAt',
      ],
    });

    const header = 'id,name,email,role,accountStatus,isEmailVerified,createdAt';
    const rows = users.map((u) =>
      [
        u.id,
        this.escapeCsv(u.name),
        this.escapeCsv(u.email),
        u.role,
        u.accountStatus,
        u.isEmailVerified,
        u.createdAt.toISOString(),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  // ── Orders CSV ────────────────────────────────────────────────────────────

  async exportOrdersCsv(query: PaginationQueryDto): Promise<string> {
    const { page, limit } = query;

    const orders = await this.orderRepo.find({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const header = 'id,userId,status,totalAmount,currency,createdAt';
    const rows = orders.map((o) =>
      [
        o.id,
        o.userId,
        o.status,
        o.totalAmount,
        o.currency,
        o.createdAt.toISOString(),
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private escapeCsv(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
