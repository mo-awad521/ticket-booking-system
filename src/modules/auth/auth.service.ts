import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already exists');

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
    });

    return { message: 'User registered. Please activate account.', data: user };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException();

    if (!user.isActive) throw new ForbiddenException('Account not activated');

    const tokens = await this.generateTokens(user);
    return tokens;
  }

  async generateTokens(user: User) {
    const payload = { sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    await this.saveRefreshToken(user, refreshToken);

    return { accessToken, refreshToken };
  }

  async saveRefreshToken(user: User, token: string) {
    const hashed = await bcrypt.hash(token, 10);

    const entity = this.refreshRepo.create({
      token: hashed,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      user,
    });

    await this.refreshRepo.save(entity);
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });

    const tokens = await this.refreshRepo.find({
      relations: ['user'],
      where: { revoked: false },
    });

    const match = await Promise.all(
      tokens.map(async (t) => ({
        entity: t,
        match: await bcrypt.compare(dto.refreshToken, t.token),
      })),
    );

    const found = match.find((m) => m.match);
    if (!found) throw new UnauthorizedException();

    found.entity.revoked = true;
    await this.refreshRepo.save(found.entity);

    return this.generateTokens(found.entity.user);
  }

  async logout(refreshToken: string) {
    const tokens = await this.refreshRepo.find();

    for (const token of tokens) {
      const match = await bcrypt.compare(refreshToken, token.token);
      if (match) {
        token.revoked = true;
        await this.refreshRepo.save(token);
        break;
      }
    }
  }
}
