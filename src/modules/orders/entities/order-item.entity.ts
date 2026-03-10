import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from './order.entity';
import { TicketType } from '../../ticket-types/entities/ticket-type.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Index()
  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => TicketType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketType;

  @Index()
  @Column({ name: 'ticket_type_id' })
  ticketTypeId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => Number(v),
    },
  })
  unitPrice: number;
}
