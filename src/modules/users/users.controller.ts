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

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me
  @Get('me')
  async getMe(
    @CurrentUser('id') userId: string,
  ): Promise<UserProfileResponseDto> {
    const user = await this.usersService.findByIdOrThrow(userId);
    return new UserProfileResponseDto(user);
  }

  // PATCH /users/me
  @Patch('me')
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(userId, dto);
  }

  // POST /users/me/change-password
  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.changePassword(userId, dto);
    return { message: 'Password changed successfully. Please log in again.' };
  }

  // DELETE /users/me — soft deactivation
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deactivateMe(
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.usersService.deactivateAccount(userId);
    return { message: 'Account deactivated successfully.' };
  }
}
