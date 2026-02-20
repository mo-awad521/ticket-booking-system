import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/modules/users/entities/user.entity';
import { AuthRequest } from '../interfaces/auth-request.interface';

export const CurrentUser = createParamDecorator(
  <K extends keyof User | undefined>(
    data: K,
    ctx: ExecutionContext,
  ): K extends keyof User ? User[K] : User => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    if (data) {
      return user[data] as K extends keyof User ? User[K] : never;
    }

    return user as K extends keyof User ? never : User;
  },
);
