import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enums/order-status.enum';

@Injectable()
export class OrderExpirationService {
  private readonly logger = new Logger(OrderExpirationService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireOrders(): Promise<void> {
    await this.dataSource.transaction(async (trx) => {
      const expiredOrders = await trx.find(Order, {
        where: {
          status: OrderStatus.PENDING,
          expiresAt: LessThan(new Date()),
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!expiredOrders.length) return;

      const expiredIds = expiredOrders.map((o) => o.id);

      await trx
        .createQueryBuilder()
        .update(Order)
        .set({ status: OrderStatus.EXPIRED })
        .whereInIds(expiredIds)
        .execute();

      this.logger.log(`Expired ${expiredOrders.length} orders`);
    });
  }
}
