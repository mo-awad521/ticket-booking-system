import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ReservationStatus } from '../enums/reservation-status.enum';
import { ReservationItem } from './reservation-item.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reservations')
export class Reservation extends BaseEntity {
  @ManyToOne(() => User, (user: User) => user.reservations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.ACTIVE,
  })
  status: ReservationStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @OneToMany(
    () => ReservationItem,
    (item: ReservationItem) => item.reservation,
    { cascade: true },
  )
  items: ReservationItem[];
}
