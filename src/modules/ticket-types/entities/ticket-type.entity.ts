import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

export const enum TicketCategory {
  VIP = 'VIP',
  REGULAR = 'Regular',
  EARLY_BIRD = 'Early Bird',
}

@Entity('ticket_types')
@Index(['eventId', 'price'])
@Index(['eventId', 'saleStart'])
@Index(['eventId', 'saleEnd'])
@Check(`quantity > 0`)
@Check(`soldQuantity >= 0`)
@Check(`reservedQuantity >= 0`)
@Check(`soldQuantity + reservedQuantity <= quantity`)
export class TicketType extends BaseEntity {
  /* -------------------------------------------------------------------------- */
  /*                                BASIC INFO                                  */
  /* -------------------------------------------------------------------------- */

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price: number;

  /* -------------------------------------------------------------------------- */
  /*                                INVENTORY                                   */
  /* -------------------------------------------------------------------------- */

  @Column({ type: 'int', unsigned: true })
  quantity: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  soldQuantity: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  reservedQuantity: number;

  /* -------------------------------------------------------------------------- */
  /*                               SALE WINDOW                                  */
  /* -------------------------------------------------------------------------- */

  @Column({ type: 'timestamp', nullable: true })
  saleStart?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  saleEnd?: Date | null;

  /* -------------------------------------------------------------------------- */
  /*                                RELATION                                    */
  /* -------------------------------------------------------------------------- */

  @ManyToOne(() => Event, (event) => event.ticketTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'event_id' })
  eventId: string;

  /* -------------------------------------------------------------------------- */
  /*                             DOMAIN HELPERS                                 */
  /* -------------------------------------------------------------------------- */

  get availableQuantity(): number {
    return this.quantity - this.soldQuantity - this.reservedQuantity;
  }

  isSaleActive(now: Date = new Date()): boolean {
    if (this.saleStart && now < this.saleStart) return false;
    if (this.saleEnd && now > this.saleEnd) return false;
    return true;
  }
}
