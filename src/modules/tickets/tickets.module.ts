import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { QrCodeService } from './services/qr-code.service';
import { Ticket } from './entities/ticket.entity';
import { Order } from '../orders/entities/order.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Order]), MediaModule],
  controllers: [TicketsController],
  providers: [TicketsService, QrCodeService],
  exports: [TicketsService],
})
export class TicketsModule {}
