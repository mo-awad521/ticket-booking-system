import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AccountStatus } from '../../modules/users/enums/account-status.enum';
import { AuthRequest } from '../interfaces/auth-request.interface';

export class AccountStatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }

    return true;
  }
}
