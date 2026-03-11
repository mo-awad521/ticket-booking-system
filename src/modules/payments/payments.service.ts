import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import type { PaymentProvider } from './providers/payment-provider.interface';
import {
  ConfirmPaymentResponseDto,
  PaymentIntentResponseDto,
} from './dtos/payment-response.dto';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject('PAYMENT_PROVIDER')
    private readonly paymentProvider: PaymentProvider,
    private readonly ticketsService: TicketsService,
  ) {}

  async createPaymentIntent(
    userId: string,
    orderId: string,
  ): Promise<PaymentIntentResponseDto> {
    const orderRepo = this.dataSource.getRepository(Order);
    const paymentRepo = this.dataSource.getRepository(Payment);

    const order = await orderRepo.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order cannot be paid');
    }

    if (order.expiresAt < new Date()) {
      throw new BadRequestException('Order has expired');
    }

    const intent = await this.paymentProvider.createPaymentIntent(
      Number(order.totalAmount),
      order.currency,
      { orderId: order.id },
    );

    const payment = paymentRepo.create({
      orderId: order.id,
      provider: 'mock',
      amount: Number(order.totalAmount),
      currency: order.currency,
      status: PaymentStatus.PENDING,
      providerPaymentId: intent.paymentId,
    });

    const savedPayment = await paymentRepo.save(payment);

    return new PaymentIntentResponseDto(savedPayment.id, intent.clientSecret);
  }

  async confirmPayment(
    userId: string,
    paymentId: string,
  ): Promise<ConfirmPaymentResponseDto> {
    const paymentRepo = this.dataSource.getRepository(Payment);

    const existingPayment = await paymentRepo.findOne({
      where: { id: paymentId },
    });

    if (!existingPayment) {
      throw new NotFoundException('Payment not found');
    }

    if (existingPayment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment already processed');
    }

    const result = await this.paymentProvider.confirmPayment(
      existingPayment.providerPaymentId,
    );

    const { payment, orderId } = await this.dataSource.transaction(
      async (trx) => {
        const pRepo = trx.getRepository(Payment);
        const oRepo = trx.getRepository(Order);

        const payment = await pRepo.findOne({
          where: { id: paymentId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!payment) throw new NotFoundException('Payment not found');

        if (payment.status !== PaymentStatus.PENDING) {
          throw new BadRequestException('Payment already processed');
        }

        if (!result.success) {
          payment.status = PaymentStatus.FAILED;
          await pRepo.save(payment);
          throw new BadRequestException('Payment failed');
        }

        payment.status = PaymentStatus.SUCCEEDED;
        await pRepo.save(payment);

        const order = await oRepo.findOne({
          where: { id: payment.orderId, userId },
        });

        if (!order) throw new NotFoundException('Order not found');

        order.status = OrderStatus.PAID;
        await oRepo.save(order);

        return { payment, orderId: order.id };
      },
    );

    try {
      await this.ticketsService.generateTicketsFromOrder(orderId);
    } catch (err) {
      this.logger.error(
        `Ticket generation failed for order ${orderId} after payment ${payment.id}`,
        err instanceof Error ? err.stack : err,
      );
    }

    return new ConfirmPaymentResponseDto(payment.id);
  }
}
