import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import type { PaymentProvider } from './interfaces/payment-provider.interface';
import {
  PaymentIntentResponseDto,
  PaymentStatusDto,
} from './dtos/payment-response.dto';

import { StripePaymentProvider } from './providers/stripe.provider';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentSucceededEvent } from './events/payment-succeeded.event';

type StripeWebhookEvent = ReturnType<
  StripePaymentProvider['constructWebhookEvent']
>;

interface StripePaymentIntentLike {
  id: string;
  status: string;
  metadata: Record<string, string>;
  last_payment_error?: { message?: string } | null;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly stripeProvider: StripePaymentProvider,
    private readonly eventEmitter: EventEmitter2,
    @Inject('PAYMENT_PROVIDER')
    private readonly paymentProvider: PaymentProvider,
  ) {}

  // ── Create PaymentIntent ─────────────────────────────────────────────────

  async createPaymentIntent(
    userId: string,
    orderId: string,
  ): Promise<PaymentIntentResponseDto> {
    const orderRepo = this.dataSource.getRepository(Order);
    const paymentRepo = this.dataSource.getRepository(Payment);

    const order = await orderRepo.findOne({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException('Order cannot be paid');
    if (order.expiresAt < new Date())
      throw new BadRequestException('Order has expired');

    // ── Idempotency guard ──────────────────────────────────────────────────
    const existing = await paymentRepo.findOne({
      where: { orderId, status: PaymentStatus.PENDING },
    });

    if (existing?.providerPaymentId && existing.clientSecret) {
      return new PaymentIntentResponseDto(
        existing.id,
        existing.providerPaymentId,
        existing.clientSecret,
      );
    }

    // ── Create PI in Stripe ────────────────────────────────────────────────
    const { paymentId, clientSecret } =
      await this.paymentProvider.createPaymentIntent(
        Number(order.totalAmount),
        order.currency,
        { orderId: order.id, userId },
      );

    const saved = await paymentRepo.save(
      paymentRepo.create({
        orderId,
        provider: 'stripe',
        amount: Number(order.totalAmount),
        currency: order.currency,
        status: PaymentStatus.PENDING,
        providerPaymentId: paymentId,
        clientSecret,
      }),
    );

    return new PaymentIntentResponseDto(saved.id, paymentId, clientSecret);
  }

  // ── Webhook ──────────────────────────────────────────────────────────────

  async handleWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = this.config.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    let event: StripeWebhookEvent;

    try {
      event = this.stripeProvider.constructWebhookEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signature mismatch';
      this.logger.warn(`Webhook signature verification failed: ${msg}`);
      throw new BadRequestException(`Webhook Error: ${msg}`);
    }
    const intent = event.data.object as StripePaymentIntentLike;

    this.logger.log(`Stripe event received: ${event.type} [${event.id}]`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.onPaymentSucceeded(intent);
        break;

      case 'payment_intent.payment_failed':
        await this.onPaymentFailed(intent);
        break;

      case 'payment_intent.canceled':
        await this.onPaymentCanceled(intent);
        break;

      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  // ── Payment status ───────────────────────────────────────────────────────

  async getPaymentStatus(
    userId: string,
    paymentId: string,
  ): Promise<PaymentStatusDto> {
    const paymentRepo = this.dataSource.getRepository(Payment);

    const payment = await paymentRepo
      .createQueryBuilder('p')
      .innerJoin(Order, 'o', 'o.id = p.order_id AND o.user_id = :userId', {
        userId,
      })
      .where('p.id = :paymentId', { paymentId })
      .getOne();

    if (!payment) throw new NotFoundException('Payment not found');

    return new PaymentStatusDto(payment);
  }

  // ── Private: onPaymentSucceeded ──────────────────────────────────────────

  private async onPaymentSucceeded(
    intent: StripePaymentIntentLike,
  ): Promise<void> {
    const paymentRepo = this.dataSource.getRepository(Payment);

    const payment = await paymentRepo.findOne({
      where: { providerPaymentId: intent.id },
    });

    if (!payment) {
      this.logger.warn(
        `No payment row found for PI ${intent.id} — Stripe may retry`,
      );
      return;
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      this.logger.warn(
        `Payment ${payment.id} already SUCCEEDED — skipping duplicate event`,
      );
      return;
    }

    // ── Transaction: Payment SUCCEEDED + Order PAID ────────────────────────
    const orderId = await this.dataSource.transaction(async (trx) => {
      const pRepo = trx.getRepository(Payment);
      const oRepo = trx.getRepository(Order);

      await pRepo.update(payment.id, { status: PaymentStatus.SUCCEEDED });

      const order = await oRepo.findOne({ where: { id: payment.orderId } });
      if (!order) return null;

      await oRepo.update(order.id, { status: OrderStatus.PAID });
      return order.id;
    });

    this.logger.log(
      `Payment ${payment.id} SUCCEEDED → Order ${payment.orderId} PAID`,
    );

    if (!orderId) return;

    this.eventEmitter.emit(
      'payment.succeeded',
      new PaymentSucceededEvent(orderId, payment.id),
    );
  }

  // ── Private: onPaymentFailed ─────────────────────────────────────────────

  private async onPaymentFailed(
    intent: StripePaymentIntentLike,
  ): Promise<void> {
    const paymentRepo = this.dataSource.getRepository(Payment);

    const failureReason =
      intent.last_payment_error?.message ?? 'Payment declined';

    await paymentRepo.update(
      { providerPaymentId: intent.id },
      { status: PaymentStatus.FAILED, failureReason },
    );

    this.logger.warn(`Payment FAILED for PI ${intent.id}: ${failureReason}`);
  }

  // ── Private: onPaymentCanceled ───────────────────────────────────────────

  private async onPaymentCanceled(
    intent: StripePaymentIntentLike,
  ): Promise<void> {
    const paymentRepo = this.dataSource.getRepository(Payment);

    await paymentRepo.update(
      { providerPaymentId: intent.id },
      { status: PaymentStatus.CANCELLED },
    );

    this.logger.log(`Payment CANCELLED for PI ${intent.id}`);
  }
}
