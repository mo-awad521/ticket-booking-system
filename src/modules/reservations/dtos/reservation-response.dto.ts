import { ApiProperty } from '@nestjs/swagger';
import { ReservationItem } from '../entities/reservation-item.entity';
import { Reservation } from '../entities/reservation.entity';

export class ReservationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt: Date;

  @ApiProperty({
    description: 'Raw reservation items (ticketTypeId + quantity)',
  })
  items: ReservationItem[];

  constructor(reservation: Reservation) {
    this.id = reservation.id;
    this.expiresAt = reservation.expiresAt;
    this.items = reservation.items;
  }
}
