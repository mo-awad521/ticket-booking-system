export class PaymentIntentResponseDto {
  paymentId: string;

  clientSecret: string;

  constructor(paymentId: string, clientSecret: string) {
    this.paymentId = paymentId;
    this.clientSecret = clientSecret;
  }
}

export class ConfirmPaymentResponseDto {
  success: boolean;
  paymentId: string;

  constructor(paymentId: string) {
    this.success = true;
    this.paymentId = paymentId;
  }
}
