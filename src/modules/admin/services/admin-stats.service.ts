import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event, EventStatus } from '../../events/entities/event.entity';
import { Order } from '../../orders/entities/order.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { OrderStatus } from '../../orders/enums/order-status.enum';
import { TicketStatus } from '../../tickets/enums/ticket-status.enum';
import { IAdminStatsReader } from '../interfaces/admin.interfaces';
import { AdminSystemStatsDto, RevenueByPeriodDto } from '../dtos/admin.dtos';

@Injectable()
export class AdminStatsService implements IAdminStatsReader {
  constructor(private readonly dataSource: DataSource) {}

  // ── System Stats ──────────────────────────────────────────────────────────

  async getSystemStats(): Promise<AdminSystemStatsDto> {
    const [userStats, eventStats, orderStats, ticketStats] = await Promise.all([
      this.getUserStats(),
      this.getEventStats(),
      this.getOrderStats(),
      this.getTicketStats(),
    ]);

    return {
      users: userStats,
      events: eventStats,
      orders: orderStats,
      tickets: ticketStats,
      generatedAt: new Date(),
    };
  }

  // ── Revenue by Period ─────────────────────────────────────────────────────

  async getRevenueByPeriod(
    period: 'day' | 'week' | 'month',
  ): Promise<RevenueByPeriodDto[]> {
    const formatMap: Record<string, string> = {
      day: '%Y-%m-%d',
      week: '%Y-%u',
      month: '%Y-%m',
    };

    const format = formatMap[period];

    const results = await this.dataSource
      .getRepository(Order)
      .createQueryBuilder('o')
      .select(`DATE_FORMAT(o.created_at, '${format}')`, 'date')
      .addSelect('SUM(o.total_amount)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .where(`o.status = '${OrderStatus.PAID}'`)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; revenue: string; orders: string }>();

    return results.map((r) => ({
      date: r.date,
      revenue: Number(r.revenue ?? 0),
      orders: Number(r.orders ?? 0),
    }));
  }

  // ── Private Aggregators ───────────────────────────────────────────────────

  private async getUserStats() {
    const results = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('u.account_status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.role, u.account_status')
      .getRawMany<{ role: string; status: string; count: string }>();

    let total = 0,
      active = 0,
      suspended = 0;
    const byRole: Record<string, number> = {};

    for (const row of results) {
      const count = Number(row.count);
      total += count;
      byRole[row.role] = (byRole[row.role] ?? 0) + count;
      if (row.status === 'active') active += count;
      if (row.status === 'suspended') suspended += count;
    }

    return { total, active, suspended, byRole };
  }

  private async getEventStats() {
    const results = await this.dataSource
      .getRepository(Event)
      .createQueryBuilder('e')
      .select('e.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.status')
      .getRawMany<{ status: string; count: string }>();

    let total = 0,
      published = 0,
      draft = 0,
      cancelled = 0;

    for (const row of results) {
      const count = Number(row.count);
      total += count;
      if (row.status === (EventStatus.PUBLISHED as string)) published += count;
      if (row.status === (EventStatus.DRAFT as string)) draft += count;
      if (row.status === (EventStatus.CANCELLED as string)) cancelled += count;
    }

    return { total, published, draft, cancelled };
  }

  private async getOrderStats() {
    const results = await this.dataSource
      .getRepository(Order)
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        `SUM(CASE WHEN o.status = '${OrderStatus.PAID}' THEN o.total_amount ELSE 0 END)`,
        'revenue',
      )
      .groupBy('o.status')
      .getRawMany<{ status: string; count: string; revenue: string }>();

    let total = 0,
      paid = 0,
      pending = 0,
      expired = 0,
      revenue = 0;

    for (const row of results) {
      const count = Number(row.count);
      total += count;
      revenue += Number(row.revenue ?? 0);
      if (row.status === (OrderStatus.PAID as string)) paid += count;
      if (row.status === (OrderStatus.PENDING as string)) pending += count;
      if (row.status === (OrderStatus.EXPIRED as string)) expired += count;
    }

    return { total, paid, pending, expired, revenue };
  }

  private async getTicketStats() {
    const results = await this.dataSource
      .getRepository(Ticket)
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('t.status')
      .getRawMany<{ status: string; count: string }>();

    let total = 0,
      used = 0,
      valid = 0,
      cancelled = 0;

    for (const row of results) {
      const count = Number(row.count);
      total += count;
      if (row.status === (TicketStatus.USED as string)) used += count;
      if (row.status === (TicketStatus.VALID as string)) valid += count;
      if (row.status === (TicketStatus.CANCELLED as string)) cancelled += count;
    }

    return { total, used, valid, cancelled };
  }
}
