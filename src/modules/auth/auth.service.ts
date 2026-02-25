import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Repository, DataSource, LessThan, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Request } from 'express';

// entities
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserVerificationToken } from './entities/user-verification-token.entity';

// services
import { UsersService } from '../users/users.service';
import { EmailService } from '../notifications/email.service';
import { TokenService } from './services/token.service';

// dtos
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

// enums
import { UserRole } from '../../common/enums/user-role.enum';
import { AccountStatus } from '../users/enums/account-status.enum';
import { VerificationTokenType } from './enums/verification-token.enum';

// interfaces
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(UserVerificationToken)
    private readonly verificationRepo: Repository<UserVerificationToken>,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    await this.refreshTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });

    await this.verificationRepo.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  //===============================================
  //     Register
  //===============================================
  async register(dto: RegisterDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const createdUser = await this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: UserRole.USER,
        accountStatus: AccountStatus.PENDING_VERIFICATION,
      });

      const savedUser = await manager.save(user);

      const verificationToken = manager.create(UserVerificationToken, {
        user: savedUser,
        tokenHash,
        type: VerificationTokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(
          Date.now() + 1000 * 60 * 60 * 24, // 24 hours
        ),
      });

      await manager.save(verificationToken);

      return savedUser;
    });

    try {
      await this.emailService.sendVerificationEmail(
        createdUser.email,
        createdUser.name,
        rawToken,
      );
    } catch (error) {
      console.log(`
        Failed to send verification email to ${createdUser.email},
        ${error}`);
    }

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  //===============================================
  //     Verify Email
  //===============================================
  async verifyEmail(rawToken: string) {
    if (!rawToken) {
      throw new BadRequestException('Invalid verification token');
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const token = await this.verificationRepo.findOne({
      where: {
        tokenHash,
        type: VerificationTokenType.EMAIL_VERIFICATION,
        usedAt: IsNull(),
      },
      relations: ['user'],
    });

    if (!token) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Verification token expired');
    }

    if (token.user.accountStatus === AccountStatus.ACTIVE) {
      return { message: 'Account already verified' };
    }

    await this.dataSource.transaction(async (manager) => {
      token.usedAt = new Date();
      token.user.accountStatus = AccountStatus.ACTIVE;

      await manager.save(token.user);
      await manager.save(token);
    });

    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        message:
          'If the account exists and is not verified, a verification email has been sent.',
      };
    }

    if (user.accountStatus === AccountStatus.ACTIVE) {
      return {
        message:
          'If the account exists and is not verified, a verification email has been sent.',
      };
    }

    await this.verificationRepo.update(
      {
        user: { id: user.id },
        type: VerificationTokenType.EMAIL_VERIFICATION,
        usedAt: IsNull(),
      },
      { usedAt: new Date() },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await this.verificationRepo.save(
      this.verificationRepo.create({
        user,
        tokenHash,
        type: VerificationTokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
      }),
    );

    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      rawToken,
    );

    return {
      message:
        'If the account exists and is not verified, a verification email has been sent.',
    };
  }

  //===============================================
  //     --- priavate store refresh token
  //===============================================
  private async storeRefreshToken(
    user: User,
    refreshToken: string,
    req?: Request,
  ) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const rawUA = req?.headers['user-agent'];

    const userAgent = Array.isArray(rawUA)
      ? String(rawUA[0] ?? 'unknown')
      : (rawUA ?? 'unknown');

    const entity = this.refreshTokenRepo.create({
      user,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
      ipAddress: req?.ip ?? 'unknown',
      userAgent,
    });

    await this.refreshTokenRepo.save(entity);
  }

  //===============================================
  //     Login
  //===============================================
  async login(dto: LoginDto, req: Request) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'password', 'name', 'role', 'accountStatus'],
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } =
      await this.tokenService.generateAuthTokens(payload);

    await this.storeRefreshToken(user, refreshToken, req);

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

  //===============================================
  //     Refresh Token
  //===============================================
  async refresh(dto: RefreshTokenDto, req: Request) {
    let decoded: JwtPayload;

    try {
      decoded = await this.tokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.refreshToken)
      .digest('hex');

    const matchedToken = await this.refreshTokenRepo.findOne({
      where: {
        tokenHash,
        isRevoked: false,
        user: { id: decoded.sub },
      },
      relations: ['user'],
    });

    if (!matchedToken) {
      await this.refreshTokenRepo.update(
        { user: { id: decoded.sub } },
        { isRevoked: true },
      );

      throw new ForbiddenException('Refresh token reuse detected');
    }

    // Rotation
    await this.refreshTokenRepo.update(
      { id: matchedToken.id },
      { isRevoked: true },
    );

    const payload: JwtPayload = {
      sub: matchedToken.user.id,
      email: matchedToken.user.email,
      role: matchedToken.user.role,
    };

    const { accessToken, refreshToken } =
      await this.tokenService.generateAuthTokens(payload);

    await this.storeRefreshToken(matchedToken.user, refreshToken, req);

    return { accessToken, refreshToken };
  }

  //===============================================
  //     Forgot Password
  //===============================================
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
      return {
        message: 'If the email exists, a reset link has been sent.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.verificationRepo.save(
      this.verificationRepo.create({
        user,
        tokenHash,
        type: VerificationTokenType.PASSWORD_RESET,
        expiresAt,
      }),
    );

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      rawToken,
    );

    return {
      message: 'If the email exists, a reset link has been sent.',
    };
  }

  //===============================================
  //     Reset Password
  //===============================================
  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const token = await this.verificationRepo.findOne({
      where: {
        tokenHash,
        type: VerificationTokenType.PASSWORD_RESET,
        usedAt: IsNull(),
      },
      relations: ['user'],
    });

    if (!token) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Reset token expired');
    }

    await this.dataSource.transaction(async (manager) => {
      token.user.password = await bcrypt.hash(dto.newPassword, 12);
      await manager.save(token.user);

      token.usedAt = new Date();
      await manager.save(token);

      await manager.update(
        RefreshToken,
        { user: { id: token.user.id } },
        { isRevoked: true },
      );
    });

    return {
      message: 'Password reset successful. Please log in again.',
    };
  }

  //===============================================
  //     Logout
  //===============================================
  async logout(refreshToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const result = await this.refreshTokenRepo.update(
      { tokenHash, isRevoked: false },
      { isRevoked: true },
    );
    if (result.affected === 0) {
      throw new UnauthorizedException('Token not found or already revoked');
    }
  }

  // private generateRandomToken(): string {
  //   return crypto.randomBytes(32).toString('hex');
  // }
}
