import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VerificationTokenType } from '../enums/verification-token.enum';

@Entity('user_verification_tokens')
export class UserVerificationToken extends BaseEntity {
  @ManyToOne(() => User, (user) => user.verificationTokens, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Index()
  @Column()
  tokenHash: string;

  @Column({
    type: 'enum',
    enum: VerificationTokenType,
  })
  type: VerificationTokenType;

  @Column()
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;
}
