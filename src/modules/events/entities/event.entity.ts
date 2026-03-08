import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TicketType } from '../../ticket-types/entities/ticket-type.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  FINISHED = 'finished',
}

@Entity('events')
@Index(['status', 'startDate'])
@Index(['organizerId', 'createdAt'])
export class Event extends BaseEntity {
  /* -------------------------------------------------------------------------- */
  /*                                  BASIC INFO                                */
  /* -------------------------------------------------------------------------- */

  @Column({ length: 150 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 150 })
  @Index()
  location: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true })
  imagePublicId?: string;

  /* -------------------------------------------------------------------------- */
  /*                                   SLUG                                     */
  /* -------------------------------------------------------------------------- */

  @Column()
  @Index({ unique: true })
  slug: string;

  /* -------------------------------------------------------------------------- */
  /*                                   DATES                                    */
  /* -------------------------------------------------------------------------- */

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  /* -------------------------------------------------------------------------- */
  /*                                   STATUS                                   */
  /* -------------------------------------------------------------------------- */

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  @Index()
  status: EventStatus;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date | null;

  /* -------------------------------------------------------------------------- */
  /*                                  RELATIONS                                 */
  /* -------------------------------------------------------------------------- */

  @ManyToOne(() => User, (user) => user.organizedEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column({ name: 'organizer_id' })
  organizerId: string;

  @OneToMany(() => TicketType, (ticket) => ticket.event)
  ticketTypes: TicketType[];

  /* -------------------------------------------------------------------------- */
  /*                                SOFT DELETE                                 */
  /* -------------------------------------------------------------------------- */

  @DeleteDateColumn()
  deletedAt?: Date;

  canBePublished(): boolean {
    if (!this.title) return false;
    if (!this.description) return false;
    if (!this.imageUrl) return false;
    if (this.status !== EventStatus.DRAFT) return false;
    if (this.startDate <= new Date()) return false;

    return true;
  }
}
