import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripePaymentProvider } from './providers/stripe.provider';

import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order]), ConfigModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripePaymentProvider,
    {
      provide: 'PAYMENT_PROVIDER',
      useClass: StripePaymentProvider,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
