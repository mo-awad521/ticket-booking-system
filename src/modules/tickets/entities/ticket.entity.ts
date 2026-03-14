import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from '../../orders/entities/order.entity';
import { TicketType } from '../../ticket-types/entities/ticket-type.entity';
import { Event } from '../../events/entities/event.entity';
import { TicketStatus } from '../enums/ticket-status.enum';

@Entity('tickets')
export class Ticket extends BaseEntity {
  // ── Order ──────────────────────────────────────────────
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Index()
  @Column({ name: 'order_id' })
  orderId: string;

  // ── TicketType ─────────────────────────────────────────
  @ManyToOne(() => TicketType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketType;

  @Index()
  @Column({ name: 'ticket_type_id' })
  ticketTypeId: string;

  @ManyToOne(() => Event, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Index()
  @Column({ name: 'event_id' })
  eventId: string;

  // ── QR & Code ──────────────────────────────────────────
  @Column({ type: 'varchar', length: 64, unique: true })
  code: string;

  @Column({ name: 'qr_code_url', type: 'varchar', length: 500, nullable: true })
  qrCodeUrl: string | null;

  // ── Status ─────────────────────────────────────────────
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.VALID })
  status: TicketStatus;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;
}
