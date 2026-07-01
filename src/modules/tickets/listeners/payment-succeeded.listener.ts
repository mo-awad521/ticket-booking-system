import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TicketsService } from '../tickets.service';
import { PaymentSucceededEvent } from '../../payments/events/payment-succeeded.event';

@Injectable()
export class PaymentSucceededListener {
  private readonly logger = new Logger(PaymentSucceededListener.name);

  constructor(private readonly ticketsService: TicketsService) {}

  @OnEvent('payment.succeeded')
  async handle(event: PaymentSucceededEvent) {
    try {
      await this.ticketsService.generateTicketsFromOrder(event.orderId);

      this.logger.log(`Tickets generated for order ${event.orderId}`);
    } catch {
      this.logger.error(`Ticket generation failed for order ${event.orderId}`);
    }
  }
}
