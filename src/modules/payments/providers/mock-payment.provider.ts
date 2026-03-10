import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ paymentId: string; clientSecret: string }> {
    return Promise.resolve({
      paymentId: randomUUID(),
      clientSecret: `mock_secret_${randomUUID()}`,
    });
  }

  confirmPayment(paymentId: string): Promise<{ success: boolean }> {
    return Promise.resolve({ success: true });
  }
}
