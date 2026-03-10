import { ReservationItem } from '../entities/reservation-item.entity';
import { Reservation } from '../entities/reservation.entity';
import { ReservationStatus } from '../enums/reservation-status.enum';

export class ReservationItemResponseDto {
  ticketTypeId: string;
  quantity: number;

  constructor(item: ReservationItem) {
    this.ticketTypeId = item.ticketTypeId;
    this.quantity = item.quantity;
  }
}

export class ReservationResponseDto {
  id: string;
  status: ReservationStatus;
  expiresAt: Date;
  items: ReservationItemResponseDto[];

  constructor(reservation: Reservation) {
    this.id = reservation.id;
    this.status = reservation.status;
    this.expiresAt = reservation.expiresAt;
    this.items = reservation.items.map(
      (item) => new ReservationItemResponseDto(item),
    );
  }
}
