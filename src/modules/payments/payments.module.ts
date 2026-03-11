import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order]),
    ConfigModule,
    TicketsModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'PAYMENT_PROVIDER',
      useClass: MockPaymentProvider,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
