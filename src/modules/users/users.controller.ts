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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserProfileResponseDto } from './dtos/user-profile-response.dto';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';
import { ApiStandardResponse } from 'src/common/decorators/api-standard-response.decorator';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me
  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  @ApiStandardResponse({
    model: UserProfileResponseDto,
    description: 'Account fetched successfully.',
  })
  @ResponseMessage('Account fetched successfully.')
  async getMe(
    @CurrentUser('id') userId: string,
  ): Promise<UserProfileResponseDto> {
    const user = await this.usersService.findByIdOrThrow(userId);
    return new UserProfileResponseDto(user);
  }

  // PATCH /users/me
  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile (name only)' })
  @ApiStandardResponse({
    model: UserProfileResponseDto,
    description: 'Account updated successfully.',
  })
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
  @ApiOperation({
    summary: 'Change the current user password',
    description:
      'Requires the current password. On success, all sessions are effectively invalidated on next login flow.',
  })
  @ApiStandardResponse({
    description: 'Password changed successfully. Please log in again.',
  })
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
  @ApiOperation({
    summary: 'Deactivate the current account (soft deactivation)',
    description: 'Sets accountStatus to DEACTIVATED. Does not delete any data.',
  })
  @ApiStandardResponse({ description: 'Account deactivated successfully.' })
  @ResponseMessage('Account deactivated successfully.')
  async deactivateMe(@CurrentUser('id') userId: string) {
    await this.usersService.deactivateAccount(userId);
  }
}
