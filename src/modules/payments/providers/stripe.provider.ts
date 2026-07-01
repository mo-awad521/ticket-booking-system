import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import {
  PaymentProvider,
  CreatePaymentIntentResult,
  RefundResult,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(StripePaymentProvider.name);

  private readonly stripe: InstanceType<typeof Stripe>;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(config.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-03-25.dahlia',
      maxNetworkRetries: 3,
      timeout: 10_000,
    });
  }

  // ── Create PaymentIntent ─────────────────────────────────────────────────

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string> = {},
  ): Promise<CreatePaymentIntentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      capture_method: 'automatic',
    });

    if (!intent.client_secret) {
      throw new InternalServerErrorException(
        `PaymentIntent ${intent.id} returned no client_secret`,
      );
    }

    this.logger.log(
      `PaymentIntent created: ${intent.id} | ` +
        `${amount} ${currency.toUpperCase()}`,
    );

    return {
      paymentId: intent.id,
      clientSecret: intent.client_secret,
    };
  }

  // ── Refund ───────────────────────────────────────────────────────────────

  async refundPayment(
    paymentIntentId: string,
    amount?: number,
  ): Promise<RefundResult> {
    const params: {
      payment_intent: string;
      reason: 'requested_by_customer';
      amount?: number;
    } = {
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
    };

    if (amount !== undefined) {
      params.amount = Math.round(amount * 100);
    }

    const refund = await this.stripe.refunds.create(params);

    this.logger.log(
      `Refund created: ${refund.id} | ` +
        `status: ${refund.status} | PI: ${paymentIntentId}`,
    );

    return {
      success: refund.status === 'succeeded' || refund.status === 'pending',
      refundId: refund.id,
    };
  }

  // ── Webhook signature verification ───────────────────────────────────────

  constructWebhookEvent(
    rawBody: Buffer,
    signature: string,
    secret: string,
  ): ReturnType<typeof this.stripe.webhooks.constructEvent> {
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }
}
