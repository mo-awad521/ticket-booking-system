export interface PaymentProvider {
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>,
  ): Promise<{
    paymentId: string;
    clientSecret: string;
  }>;

  confirmPayment(paymentId: string): Promise<{
    success: boolean;
  }>;
}
