// tickets/listeners/payment-succeeded.listener.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { TicketsService } from '../tickets.service';
import { NotificationQueueService } from '../../notifications/services/notification-queue.service';
import { PaymentSucceededEvent } from '../../payments/events/payment-succeeded.event';
import { Order } from '../../orders/entities/order.entity';

@Injectable()
export class PaymentSucceededListener {
  private readonly logger = new Logger(PaymentSucceededListener.name);

  constructor(
    private readonly ticketsService: TicketsService,
    private readonly notificationQueue: NotificationQueueService,
    private readonly dataSource: DataSource,
  ) {}

  @OnEvent('payment.succeeded', { async: true })
  async handle(event: PaymentSucceededEvent): Promise<void> {
    // ── 1. Generate tickets ──────────────────────────────────────────────
    let tickets: Awaited<
      ReturnType<TicketsService['generateTicketsFromOrder']>
    >;

    try {
      tickets = await this.ticketsService.generateTicketsFromOrder(
        event.orderId,
      );
      this.logger.log(`Tickets generated for order ${event.orderId}`);
    } catch (err) {
      this.logger.error(
        `Ticket generation failed for order ${event.orderId}`,
        err instanceof Error ? err.stack : err,
      );
      return; // لا نُرسل الإيميل إذا فشل توليد التذاكر
    }

    // ── 2. Load Order with user + event ─────────────────────────────────
    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id: event.orderId },
      relations: [
        'user',
        'items',
        'items.ticketType',
        'items.ticketType.event',
      ],
    });

    if (!order?.user?.email) {
      this.logger.warn(
        `Order ${event.orderId}: user email missing — email skipped`,
      );
      return;
    }

    const { user } = order;
    const firstEvent = order.items[0]?.ticketType?.event;

    if (!firstEvent) {
      this.logger.warn(
        `Order ${event.orderId}: event data missing — email skipped`,
      );
      return;
    }

    // ── 3. Queue ticket email ────────────────────────────────────────────
    try {
      await this.notificationQueue.sendTicketGenerated({
        to: user.email,
        name: user.name,
        eventTitle: firstEvent.title,
        eventDate: firstEvent.startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        eventLocation: firstEvent.location,
        ticketCount: tickets.length,
        tickets: tickets.map((t) => ({
          code: t.code,
          qrCodeUrl: t.qrCodeUrl ?? '',
        })),
      });

      this.logger.log(
        `Ticket email queued → ${user.email} | ${tickets.length} ticket(s)`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to queue ticket email for order ${event.orderId}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
