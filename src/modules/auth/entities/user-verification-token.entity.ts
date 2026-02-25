import { Entity, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VerificationTokenType } from '../enums/verification-token.enum';

@Entity('user_verification_tokens')
export class UserVerificationToken extends BaseEntity {
  @ManyToOne(() => User, (user) => user.verificationTokens, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  tokenHash: string;

  @Column({
    type: 'enum',
    enum: VerificationTokenType,
  })
  type: VerificationTokenType;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  usedAt: Date;
}
