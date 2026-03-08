import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { UserVerificationToken } from '../../auth/entities/user-verification-token.entity';
import { AccountStatus } from '../enums/account-status.enum';
import { Event } from '../../events/entities/event.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.PENDING_VERIFICATION,
  })
  accountStatus: AccountStatus;

  @OneToMany(() => UserVerificationToken, (token) => token.user)
  verificationTokens: UserVerificationToken[];

  @Column({ default: false })
  isEmailVerified: boolean;

  @OneToMany(() => Event, (event) => event.organizer)
  organizedEvents: Event[];
}
