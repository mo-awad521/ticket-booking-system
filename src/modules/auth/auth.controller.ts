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
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  @Post('register')
  @ResponseMessage(
    'Registration successful. Please check your email to verify your account.',
  )
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // GET /auth/verify-email?token=...
  @Get('verify-email')
  @ResponseMessage('Email verified successfully. You can now log in.')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // POST /auth/resend-verification
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { limit: 3, ttl: 3_600_000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
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
  @ResponseMessage('Login successfully')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  // POST /auth/refresh
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Refresh created successfully')
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto, req);
  }

  // POST /auth/forgot-password
  @UseGuards(ThrottlerGuard)
  @Throttle({ strict: { limit: 3, ttl: 3_600_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  //@ResponseMessage('If the email exists, a reset link has been sent.')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // POST /auth/reset-password
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password reset successful. Please log in again.')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // POST /auth/logout
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  // POST /auth/logout-all
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logged out from all devices successfully')
  async logoutAll(@CurrentUser('id') userId: string) {
    await this.authService.logoutAll(userId);
  }

  // GET /auth/sessions
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ResponseMessage('Get all sessions successfully')
  getSessions(@CurrentUser('id') userId: string) {
    return this.authService.getSessions(userId);
  }

  // DELETE /auth/sessions/:id
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  revokeSession(
    @Param('id', ParseUUIDPipe) tokenId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.authService.revokeSession(tokenId, userId);
  }
}
