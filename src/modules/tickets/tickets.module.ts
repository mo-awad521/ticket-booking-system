import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Ticket } from './entities/ticket.entity';
import { Order } from '../orders/entities/order.entity';
import { MediaModule } from '../media/media.module';
import { TicketsController } from './controllers/tickets.controller';
import { ScannerController } from './controllers/scanner.controller';
import { TicketsService } from './tickets.service';
import { QrCodeService } from './services/qr-code.service';
import { TicketSignatureService } from './services/ticket-signature.service';
import { TicketValidationService } from './services/ticket-validation.service';
import { EventStaffAssignment } from '../events/entities/event-staff-assignment.entity';

@Module({
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([Ticket, Order, EventStaffAssignment]),

    MediaModule,
  ],

  controllers: [TicketsController, ScannerController],

  providers: [
    TicketsService,
    QrCodeService,
    TicketSignatureService,
    TicketValidationService,
  ],

  exports: [TicketsService],
})
export class TicketsModule {}
