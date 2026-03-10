import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { ReservationStatus } from '../enums/reservation-status.enum';
import { TicketType } from '../../ticket-types/entities/ticket-type.entity';

@Injectable()
export class ReservationExpirationService {
  private readonly logger = new Logger(ReservationExpirationService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron('0 */1 * * * *')
  async handleExpiredReservations() {
    await this.dataSource.transaction(async (trx) => {
      const expiredReservations = await trx.find(Reservation, {
        where: {
          status: ReservationStatus.ACTIVE,
          expiresAt: LessThan(new Date()),
        },
        relations: ['items'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!expiredReservations.length) return;

      this.logger.log(
        `Processing ${expiredReservations.length} expired reservations`,
      );

      const quantityMap = new Map<string, number>();

      for (const reservation of expiredReservations) {
        for (const item of reservation.items) {
          const prev = quantityMap.get(item.ticketTypeId) ?? 0;
          quantityMap.set(item.ticketTypeId, prev + item.quantity);
        }
      }

      for (const [ticketTypeId, qty] of quantityMap) {
        await trx
          .createQueryBuilder()
          .update(TicketType)
          .set({
            reservedQuantity: () => `GREATEST(reserved_quantity - ${qty}, 0)`,
          })
          .where('id = :id', { id: ticketTypeId })
          .execute();
      }

      const expiredIds = expiredReservations.map((r) => r.id);

      await trx
        .createQueryBuilder()
        .update(Reservation)
        .set({ status: ReservationStatus.EXPIRED })
        .whereInIds(expiredIds)
        .execute();

      this.logger.log(
        `Expired ${expiredIds.length} reservations and released quantities for ${quantityMap.size} ticket types`,
      );
    });
  }
}
