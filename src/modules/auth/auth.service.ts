import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Request } from 'express';

// entities
import { User } from '../users/entities/user.entity';
import { UserVerificationToken } from './entities/user-verification-token.entity';

// services
import { UsersService } from '../users/users.service';
import { EmailService } from '../notifications/email.service';
import { TokenService, SessionInfo } from './services/token.service';

// dtos
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// enums + interfaces
import { UserRole } from '../../common/enums/user-role.enum';
import { AccountStatus } from '../users/enums/account-status.enum';
import { VerificationTokenType } from './enums/verification-token.enum';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserVerificationToken)
    private readonly verificationRepo: Repository<UserVerificationToken>,

    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly dataSource: DataSource,
  ) {}

  // ── Cron: Cleanup ─────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens(): Promise<void> {
    await this.tokenService.deleteExpiredTokens();
    await this.verificationRepo.delete({
      expiresAt: LessThan(new Date()),
    });
    this.logger.log('Expired tokens cleaned up');
  }

  // ── Register ──────────────────────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<{ message: string }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    let createdUser: User;

    try {
      createdUser = await this.dataSource.transaction(async (manager) => {
        const userEntity = manager.create(User, {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: UserRole.USER,
          accountStatus: AccountStatus.PENDING_VERIFICATION,
        });

        const savedUser = await manager.save(userEntity);

        await manager.save(
          manager.create(UserVerificationToken, {
            user: savedUser,
            tokenHash,
            type: VerificationTokenType.EMAIL_VERIFICATION,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }),
        );

        return savedUser;
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }

    try {
      await this.emailService.sendVerificationEmail(
        createdUser.email,
        createdUser.name,
        rawToken,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send verification email to ${createdUser.email}: ${msg}`,
      );
    }

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }
  // ── Verify Email ──────────────────────────────────────────────────────────

  async verifyEmail(rawToken: string): Promise<{ message: string }> {
    if (!rawToken?.trim()) {
      throw new BadRequestException('Verification token is required');
    }

    const tokenHash = this.hashToken(rawToken);
    const token = await this.verificationRepo.findOne({
      where: {
        tokenHash,
        type: VerificationTokenType.EMAIL_VERIFICATION,
        usedAt: IsNull(),
      },
      relations: ['user'],
    });

    if (!token || token.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (token.user.accountStatus === AccountStatus.ACTIVE) {
      return { message: 'Account already verified' };
    }

    await this.dataSource.transaction(async (manager) => {
      token.usedAt = new Date();
      token.user.accountStatus = AccountStatus.ACTIVE;
      token.user.isEmailVerified = true;
      await manager.save(token.user);
      await manager.save(token);
    });

    return { message: 'Email verified successfully. You can now log in.' };
  }

  // ── Resend Verification ───────────────────────────────────────────────────

  async resendVerification(
    dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const GENERIC =
      'If the account exists and is not verified, a verification email has been sent.';

    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.accountStatus === AccountStatus.ACTIVE) {
      return { message: GENERIC };
    }

    // إلغاء الـ tokens القديمة
    await this.verificationRepo.update(
      {
        user: { id: user.id },
        type: VerificationTokenType.EMAIL_VERIFICATION,
        usedAt: IsNull(),
      },
      { usedAt: new Date() },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.verificationRepo.save(
      this.verificationRepo.create({
        user,
        tokenHash,
        type: VerificationTokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    );

    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      rawToken,
    );
    return { message: GENERIC };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    req: Request,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; name: string; role: UserRole };
  }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.assertAccountActive(user.accountStatus);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } =
      await this.tokenService.generateAuthTokens(payload);

    await this.tokenService.storeRefreshToken(user, refreshToken, req);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // ── Refresh Token ─────────────────────────────────────────────────────────

  async refresh(
    dto: RefreshTokenDto,
    req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: JwtPayload;

    try {
      decoded = await this.tokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const matchedToken = await this.tokenService.findValidToken(
      dto.refreshToken,
      decoded.sub,
    );

    if (!matchedToken) {
      await this.tokenService.revokeAllSessions(decoded.sub);
      this.logger.warn(
        `Refresh token reuse detected for user ${decoded.sub} — all sessions revoked`,
      );
      throw new ForbiddenException(
        'Refresh token reuse detected. Please log in again.',
      );
    }

    await this.tokenService.revokeToken(matchedToken.id);

    const payload: JwtPayload = {
      sub: matchedToken.user.id,
      email: matchedToken.user.email,
      role: matchedToken.user.role,
    };

    const { accessToken, refreshToken } =
      await this.tokenService.generateAuthTokens(payload);

    await this.tokenService.storeRefreshToken(
      matchedToken.user,
      refreshToken,
      req,
    );

    return { accessToken, refreshToken };
  }

  // ── Forgot Password ───────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const GENERIC = 'If the email exists, a reset link has been sent.';
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
      return { message: GENERIC };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.verificationRepo.save(
      this.verificationRepo.create({
        user,
        tokenHash,
        type: VerificationTokenType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      }),
    );

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      rawToken,
    );
    return { message: GENERIC };
  }

  // ── Reset Password ────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.token);
    const token = await this.verificationRepo.findOne({
      where: {
        tokenHash,
        type: VerificationTokenType.PASSWORD_RESET,
        usedAt: IsNull(),
      },
      relations: ['user'],
    });

    if (!token || token.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.dataSource.transaction(async (manager) => {
      token.user.password = await bcrypt.hash(dto.newPassword, 12);
      token.usedAt = new Date();
      await manager.save(token.user);
      await manager.save(token);
    });

    await this.tokenService.revokeAllSessions(token.user.id);

    return { message: 'Password reset successful. Please log in again.' };
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(refreshToken: string): Promise<void> {
    const revoked = await this.tokenService.revokeByHash(refreshToken);
    if (!revoked) {
      throw new UnauthorizedException('Token not found or already revoked');
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokenService.revokeAllSessions(userId);
  }

  // ── Sessions ──────────────────────────────────────────────────────────────

  async getSessions(userId: string): Promise<SessionInfo[]> {
    return this.tokenService.getActiveSessions(userId);
  }

  async revokeSession(
    tokenId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const revoked = await this.tokenService.revokeSession(tokenId, userId);
    if (!revoked) {
      throw new UnauthorizedException('Session not found');
    }
    return { message: 'Session revoked successfully' };
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private assertAccountActive(status: AccountStatus): void {
    switch (status) {
      case AccountStatus.ACTIVE:
        return;
      case AccountStatus.PENDING_VERIFICATION:
        throw new ForbiddenException(
          'Please verify your email to activate your account',
        );
      case AccountStatus.SUSPENDED:
        throw new ForbiddenException(
          'Your account has been suspended. Please contact support.',
        );
      case AccountStatus.BANNED:
        throw new ForbiddenException(
          'Your account has been permanently banned.',
        );
      case AccountStatus.DEACTIVATED:
        throw new ForbiddenException(
          'Your account is deactivated. Please reactivate it.',
        );
    }
  }
}
