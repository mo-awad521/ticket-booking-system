export interface CreatePaymentIntentResult {
  paymentId: string;
  clientSecret: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
}

export interface PaymentProvider {
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>,
  ): Promise<CreatePaymentIntentResult>;

  refundPayment(
    paymentIntentId: string,
    amount?: number,
  ): Promise<RefundResult>;
}
