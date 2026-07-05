import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  @Post('register')
  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Creates a USER account in PENDING_VERIFICATION status and sends a verification email.',
  })
  @ApiStandardResponse({
    status: 201,
    description:
      'Registration successful. Please check your email to verify your account.',
  })
  @ResponseMessage(
    'Registration successful. Please check your email to verify your account.',
  )
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // GET /auth/verify-email?token=...
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email using the token sent by email' })
  @ApiStandardResponse({
    description: 'Email verified successfully. You can now log in.',
  })
  @ResponseMessage('Email verified successfully. You can now log in.')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // POST /auth/resend-verification
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { limit: 3, ttl: 3_600_000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend the email verification link',
    description: 'Rate limited to 3 requests per hour per IP.',
  })
  @ApiStandardResponse({
    description:
      'If the account exists and is not verified, a verification email has been sent.',
  })
  @ResponseMessage(
    'If the account exists and is not verified, a verification email has been sent.',
  )
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  // POST /auth/login
  @UseGuards(ThrottlerGuard)
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login and receive an access/refresh token pair',
    description: 'Rate limited to 5 attempts per minute per IP.',
  })
  @ApiStandardResponse({ description: 'Login successfully' })
  @ResponseMessage('Login successfully')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  // POST /auth/refresh
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and get a new token pair' })
  @ApiStandardResponse({ description: 'Refresh created successfully' })
  @ResponseMessage('Refresh created successfully')
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto, req);
  }

  // POST /auth/forgot-password
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { limit: 3, ttl: 3_600_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset email',
    description:
      'Always returns a generic message to avoid leaking account existence.',
  })
  @ApiStandardResponse({
    description: 'If the email exists, a reset link has been sent.',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // POST /auth/reset-password
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using the token sent by email' })
  @ApiStandardResponse({
    description: 'Password reset successful. Please log in again.',
  })
  @ResponseMessage('Password reset successful. Please log in again.')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // POST /auth/logout
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the current refresh token / session' })
  @ApiStandardResponse({ description: 'Logged out successfully' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  // POST /auth/logout-all
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all active sessions for the current user' })
  @ApiStandardResponse({
    description: 'Logged out from all devices successfully',
  })
  @ResponseMessage('Logged out from all devices successfully')
  async logoutAll(@CurrentUser('id') userId: string) {
    await this.authService.logoutAll(userId);
  }

  // GET /auth/sessions
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiOperation({ summary: 'List all active sessions for the current user' })
  @ApiStandardResponse({ description: 'Get all sessions successfully' })
  @ResponseMessage('Get all sessions successfully')
  getSessions(@CurrentUser('id') userId: string) {
    return this.authService.getSessions(userId);
  }

  // DELETE /auth/sessions/:id
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke a specific session by its refresh-token id',
  })
  @ApiStandardResponse({ description: 'Session revoked successfully' })
  revokeSession(
    @Param('id', ParseUUIDPipe) tokenId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.authService.revokeSession(tokenId, userId);
  }
}
