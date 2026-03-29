import { UserRole } from 'src/common/enums/user-role.enum';
import { User } from '../entities/user.entity';
import { AccountStatus } from '../enums/account-status.enum';

export class UserProfileResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  isEmailVerified: boolean;
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
