import * as common from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';

@common.Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /* -------------------------------------------------------------------------- */
  /*  POST /payments/:orderId/intent                                            */
  /*  Auth required — creates Stripe PaymentIntent, returns clientSecret        */
  /* -------------------------------------------------------------------------- */
  @common.UseGuards(JwtAuthGuard)
  @common.Post(':orderId/intent')
  @ResponseMessage('Payment intent created successfully')
  createIntent(
    @CurrentUser('id') userId: string,
    @common.Param('orderId', common.ParseUUIDPipe) orderId: string,
  ) {
    return this.paymentsService.createPaymentIntent(userId, orderId);
  }

  /* -------------------------------------------------------------------------- */
  /*  GET /payments/:paymentId/status                                           */
  /*  Auth required — returns current payment status                            */
  /* -------------------------------------------------------------------------- */
  @common.UseGuards(JwtAuthGuard)
  @common.Get(':paymentId/status')
  @ResponseMessage('Payment status fetched successfully')
  getStatus(
    @CurrentUser('id') userId: string,
    @common.Param('paymentId', common.ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentsService.getPaymentStatus(userId, paymentId);
  }

  /* -------------------------------------------------------------------------- */
  /*  POST /payments/webhook                                                    */
  /*  Public — called by Stripe servers, verified via HMAC signature            */
  /* -------------------------------------------------------------------------- */
  @common.Post('webhook')
  @common.HttpCode(common.HttpStatus.OK)
  async handleWebhook(
    @common.Req() req: common.RawBodyRequest<Request>,
    @common.Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new Error(
        'Raw body not available. Ensure rawBody: true is set in NestFactory.create()',
      );
    }

    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
