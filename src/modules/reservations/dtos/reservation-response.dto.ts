import { ReservationItem } from '../entities/reservation-item.entity';
import { Reservation } from '../entities/reservation.entity';

export class ReservationResponseDto {
  id: string;

  expiresAt: Date;

  items: ReservationItem[];

  constructor(reservation: Reservation) {
    this.id = reservation.id;
    this.expiresAt = reservation.expiresAt;
    this.items = reservation.items;
  }
}
