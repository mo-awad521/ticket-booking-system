import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Event, EventStatus } from '../events/entities/event.entity';
import { TicketType } from '../ticket-types/entities/ticket-type.entity';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ReservationResponseDto } from './dtos/reservation-response.dto';
import { ReservationItem } from './entities/reservation-item.entity';
import { Reservation } from './entities/reservation.entity';
import { ReservationStatus } from './enums/reservation-status.enum';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                           Create Reservation                               */
  /* -------------------------------------------------------------------------- */

  async createReservation(userId: string, dto: CreateReservationDto) {
    const mergedItems = this.mergeItems(dto.items);

    return this.dataSource.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(Reservation);
      const ticketRepo = manager.getRepository(TicketType);
      const reservationItemRepo = manager.getRepository(ReservationItem);

      const ticketsToUpdate: TicketType[] = [];
      const itemsToSave: Partial<ReservationItem>[] = [];
      const now = new Date();

      for (const item of mergedItems) {
        const ticket = await ticketRepo.findOne({
          where: { id: item.ticketTypeId },
          relations: ['event'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!ticket) {
          throw new NotFoundException(
            `Ticket type ${item.ticketTypeId} not found`,
          );
        }

        if (ticket.event.status !== EventStatus.PUBLISHED) {
          throw new BadRequestException(
            `Event for ticket "${ticket.name}" is not available for booking`,
          );
        }

        if (ticket.event.startDate <= now) {
          throw new BadRequestException(
            `Event for ticket "${ticket.name}" has already started`,
          );
        }

        if (ticket.saleStart && now < ticket.saleStart) {
          throw new BadRequestException(
            `Sale for "${ticket.name}" has not started yet`,
          );
        }

        if (ticket.saleEnd && now > ticket.saleEnd) {
          throw new BadRequestException(`Sale for "${ticket.name}" has ended`);
        }

        const available =
          ticket.quantity - ticket.soldQuantity - ticket.reservedQuantity;

        if (available < item.quantity) {
          throw new BadRequestException(
            `Not enough tickets for "${ticket.name}". Available: ${available}`,
          );
        }

        ticket.reservedQuantity += item.quantity;
        ticketsToUpdate.push(ticket);

        itemsToSave.push({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
        });
      }

      const expirationMinutes = this.config.get<number>(
        'RESERVATION_EXPIRY_MINUTES',
        10,
      );

      const reservation = reservationRepo.create({
        userId,
        expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
        status: ReservationStatus.ACTIVE,
      });

      const savedReservation = await reservationRepo.save(reservation);

      await ticketRepo.save(ticketsToUpdate);

      const items = reservationItemRepo.create(
        itemsToSave.map((i) => ({
          ...i,
          reservationId: savedReservation.id,
        })),
      );

      const savedItems = await reservationItemRepo.save(items);

      savedReservation.items = savedItems;

      return new ReservationResponseDto(savedReservation);
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                              Helper Methods                                */
  /* -------------------------------------------------------------------------- */

  private mergeItems(
    items: { ticketTypeId: string; quantity: number }[],
  ): { ticketTypeId: string; quantity: number }[] {
    const map = new Map<string, number>();

    for (const item of items) {
      const prev = map.get(item.ticketTypeId) ?? 0;
      map.set(item.ticketTypeId, prev + item.quantity);
    }

    return Array.from(map.entries()).map(([ticketTypeId, quantity]) => ({
      ticketTypeId,
      quantity,
    }));
  }
}
