import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import { Request } from 'express';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

const MAX_ACTIVE_SESSIONS = 5;

export interface SessionInfo {
  id: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {
    this.config.getOrThrow<string>('JWT_SECRET');
    this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  // ── Generate ──────────────────────────────────────────────────────────────

  async generateAuthTokens(payload: JwtPayload): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ── Verify ────────────────────────────────────────────────────────────────

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  // ── Store ─────────────────────────────────────────────────────────────────

  async storeRefreshToken(
    user: User,
    refreshToken: string,
    req?: Request,
  ): Promise<void> {
    const activeCount = await this.refreshTokenRepo.count({
      where: { userId: user.id, isRevoked: false },
    });

    if (activeCount >= MAX_ACTIVE_SESSIONS) {
      const oldest = await this.refreshTokenRepo.findOne({
        where: { userId: user.id, isRevoked: false },
        order: { createdAt: 'ASC' },
      });
      if (oldest) {
        await this.refreshTokenRepo.update(
          { id: oldest.id },
          { isRevoked: true },
        );
        this.logger.log(
          `Max sessions reached for user ${user.id} — oldest session revoked`,
        );
      }
    }

    const tokenHash = this.hashToken(refreshToken);
    const rawUA = req?.headers['user-agent'];
    const userAgent = Array.isArray(rawUA)
      ? String(rawUA[0] ?? 'unknown')
      : (rawUA ?? 'unknown');

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        user,
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        ipAddress: req?.ip ?? 'unknown',
        userAgent,
      }),
    );
  }

  // ── Sessions ──────────────────────────────────────────────────────────────

  async getActiveSessions(userId: string): Promise<SessionInfo[]> {
    const tokens = await this.refreshTokenRepo.find({
      where: { userId, isRevoked: false },
      order: { createdAt: 'DESC' },
    });

    return tokens.map((t) => ({
      id: t.id,
      ipAddress: t.ipAddress,
      userAgent: t.userAgent,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
    }));
  }

  async revokeSession(tokenId: string, userId: string): Promise<boolean> {
    const result = await this.refreshTokenRepo.update(
      { id: tokenId, userId, isRevoked: false },
      { isRevoked: true },
    );
    return (result.affected ?? 0) > 0;
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  // ── Find for validation ───────────────────────────────────────────────────

  async findValidToken(
    rawToken: string,
    userId: string,
  ): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(rawToken);
    return this.refreshTokenRepo.findOne({
      where: { tokenHash, isRevoked: false, userId },
      relations: ['user'],
    });
  }

  async revokeToken(tokenId: string): Promise<void> {
    await this.refreshTokenRepo.update({ id: tokenId }, { isRevoked: true });
  }

  async revokeByHash(rawToken: string): Promise<boolean> {
    const tokenHash = this.hashToken(rawToken);
    const result = await this.refreshTokenRepo.update(
      { tokenHash, isRevoked: false },
      { isRevoked: true },
    );
    return (result.affected ?? 0) > 0;
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  async deleteExpiredTokens(): Promise<void> {
    await this.refreshTokenRepo.delete({ expiresAt: LessThan(new Date()) });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
