import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from '../../orders/entities/order.entity';
import { TicketType } from '../../ticket-types/entities/ticket-type.entity';
import { TicketStatus } from '../enums/ticket-status.enum';

@Entity('tickets')
export class Ticket extends BaseEntity {
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Index()
  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => TicketType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketType;

  @Index()
  @Column({ name: 'ticket_type_id' })
  ticketTypeId: string;

  @Column({
    type: 'varchar',
    length: 64,
    unique: true,
  })
  code: string;

  @Column({
    name: 'qr_code_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  qrCodeUrl: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.VALID,
  })
  status: TicketStatus;
}
