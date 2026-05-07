import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserProfileResponseDto } from './dtos/user-profile-response.dto';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me
  @Get('me')
  @ResponseMessage('Account fetched successfully.')
  async getMe(
    @CurrentUser('id') userId: string,
  ): Promise<UserProfileResponseDto> {
    const user = await this.usersService.findByIdOrThrow(userId);
    return new UserProfileResponseDto(user);
  }

  // PATCH /users/me
  @Patch('me')
  @ResponseMessage('Account updated successfully.')
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(userId, dto);
  }

  // POST /users/me/change-password
  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password changed successfully. Please log in again.')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, dto);
  }

  // DELETE /users/me — soft deactivation
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Account deactivated successfully.')
  async deactivateMe(@CurrentUser('id') userId: string) {
    await this.usersService.deactivateAccount(userId);
  }
}
