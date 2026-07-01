import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from '../../orders/entities/order.entity';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Index()
  @Column({ name: 'order_id' })
  orderId: string;

  // ── Provider info ──────────────────────────────────────────────────────
  @Column({ default: 'stripe' })
  provider: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => Number(v),
    },
  })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // ── Stripe fields ──────────────────────────────────────────────────────

  /** Stripe PaymentIntent ID — pi_xxxxxx */
  @Index()
  @Column({ name: 'provider_payment_id', nullable: true })
  providerPaymentId: string;

  @Column({
    name: 'client_secret',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  clientSecret: string | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;
}
