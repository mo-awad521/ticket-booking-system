import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { AccountStatus } from './enums/account-status.enum';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserProfileResponseDto } from './dtos/user-profile-response.dto';

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ── READ ─────────────────────────────────────────────────────────────────

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password') // ← يُرجع password فقط هنا
      .where('u.email = :email', { email })
      .getOne();
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── CREATE ────────────────────────────────────────────────────────────────

  create(data: Partial<User>): User {
    return this.userRepo.create(data);
  }

  async save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  // ── UPDATE: Profile ───────────────────────────────────────────────────────

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const user = await this.findByIdOrThrow(userId);

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    const saved = await this.userRepo.save(user);
    return new UserProfileResponseDto(saved);
  }

  // ── UPDATE: Password ──────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.id = :id', { id: userId })
      .getOne();

    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const isSame = await bcrypt.compare(dto.newPassword, user.password);
    if (isSame) {
      throw new BadRequestException(
        'New password must be different from the current one',
      );
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);
  }

  // ── UPDATE: Status ────────────────────────────────────────────────────────

  async updateStatus(userId: string, status: AccountStatus): Promise<User> {
    const user = await this.findByIdOrThrow(userId);
    user.accountStatus = status;
    return this.userRepo.save(user);
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.findByIdOrThrow(userId);
    user.accountStatus = AccountStatus.ACTIVE;
    user.isEmailVerified = true;
    return this.userRepo.save(user);
  }

  // ── DEACTIVATE (Self) ─────────────────────────────────────────────────────

  async deactivateAccount(userId: string): Promise<void> {
    await this.updateStatus(userId, AccountStatus.DEACTIVATED);
  }
}
