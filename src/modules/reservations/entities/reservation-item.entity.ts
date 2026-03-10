import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Reservation } from './reservation.entity';
import { TicketType } from '../../ticket-types/entities/ticket-type.entity';

@Entity('reservation_items')
export class ReservationItem extends BaseEntity {
  @ManyToOne(
    () => Reservation,
    (reservation: Reservation) => reservation.items,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Index()
  @Column()
  reservationId: string;

  @ManyToOne(() => TicketType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketType;

  @Index()
  @Column({ name: 'ticket_type_id' })
  ticketTypeId: string;

  @Column({ type: 'int' })
  quantity: number;
}
