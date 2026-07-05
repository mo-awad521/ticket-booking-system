import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';
import { User } from '../entities/user.entity';
import { AccountStatus } from '../enums/account-status.enum';

export class UserProfileResponseDto {
  @ApiProperty({ example: 'b3f1c2e0-...-uuid' })
  id: string;

  @ApiProperty({ example: 'Mohammad Awad' })
  name: string;

  @ApiProperty({ example: 'mohammad@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @ApiProperty({ enum: AccountStatus, example: AccountStatus.ACTIVE })
  accountStatus: AccountStatus;

  @ApiProperty({ example: true })
  isEmailVerified: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.accountStatus = user.accountStatus;
    this.isEmailVerified = user.isEmailVerified;
    this.createdAt = user.createdAt;
  }
}
