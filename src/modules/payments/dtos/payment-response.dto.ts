import { Payment } from '../entities/payment.entity';

// ── Create Intent ─────────────────────────────────────────────────────────────
export class PaymentIntentResponseDto {
  paymentId: string;
  stripePaymentIntentId: string;
  clientSecret: string;

  constructor(
    paymentId: string,
    stripePaymentIntentId: string,
    clientSecret: string,
  ) {
    this.paymentId = paymentId;
    this.stripePaymentIntentId = stripePaymentIntentId;
    this.clientSecret = clientSecret;
  }
}

// ── Webhook acknowledged ──────────────────────────────────────────────────────
export class WebhookAcknowledgedDto {
  received: boolean = true;
}

// ── Payment status ────────────────────────────────────────────────────────────
export class PaymentStatusDto {
  id: string;
  status: string;
  amount: number;
  currency: string;
  orderId: string;
  createdAt: Date;

  constructor(payment: Payment) {
    this.id = payment.id;
    this.status = payment.status;
    this.amount = Number(payment.amount);
    this.currency = payment.currency;
    this.orderId = payment.orderId;
    this.createdAt = payment.createdAt;
  }
}
