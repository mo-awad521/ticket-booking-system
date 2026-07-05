import * as common from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';
import { ApiStandardResponse } from 'src/common/decorators/api-standard-response.decorator';
import { PaymentIntentResponseDto } from './dtos/payment-response.dto';

@ApiTags('Payments')
@common.Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /* -------------------------------------------------------------------------- */
  /*  POST /payments/:orderId/intent                                            */
  /*  Auth required — creates Stripe PaymentIntent, returns clientSecret        */
  /* -------------------------------------------------------------------------- */
  @ApiBearerAuth('access-token')
  @common.UseGuards(JwtAuthGuard)
  @common.Post(':orderId/intent')
  @ApiParam({
    name: 'orderId',
    description: 'A PENDING, non-expired order UUID owned by the current user',
  })
  @ApiOperation({
    summary: 'Create a Stripe payment intent for an order',
    description:
      'Creates a Stripe PaymentIntent for the order total and returns a clientSecret. ' +
      'The frontend uses this clientSecret with @stripe/react-stripe-js to collect payment details.',
  })
  @ApiStandardResponse({
    model: PaymentIntentResponseDto,
    status: 201,
    description: 'Payment intent created successfully',
  })
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
  @ApiBearerAuth('access-token')
  @common.UseGuards(JwtAuthGuard)
  @common.Get(':paymentId/status')
  @ApiParam({
    name: 'paymentId',
    description: 'Payment UUID returned from the intent endpoint',
  })
  @ApiOperation({
    summary: 'Get the current status of a payment',
    description:
      'Used by the frontend usePaymentStatus polling hook to detect terminal states ' +
      '(succeeded/failed) after the Stripe webhook updates the payment record.',
  })
  @ApiStandardResponse({ description: 'Payment status fetched successfully' })
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
  @ApiExcludeEndpoint() // Called only by Stripe servers — not part of the public API surface
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
