import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationExpirationService } from './services/reservation-expiration.service';
import { Reservation } from './entities/reservation.entity';
import { ReservationItem } from './entities/reservation-item.entity';
import { TicketType } from '../ticket-types/entities/ticket-type.entity';
import { Event } from '../events/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ReservationItem, TicketType, Event]),
    ConfigModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationExpirationService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
