import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AccountStatus } from '../../users/enums/account-status.enum';
import { AuditLog } from '../decorators/audit-log.decorator';
import {
  IAdminUserReader,
  IAdminUserWriter,
} from '../interfaces/admin.interfaces';
import {
  AdminUserResponseDto,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../dtos/admin.dtos';

@Injectable()
export class AdminUsersService implements IAdminUserReader, IAdminUserWriter {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    readonly dataSource: DataSource,
  ) {}

  // ── READ ─────────────────────────────────────────────────────────────────

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<AdminUserResponseDto>> {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    let where: object = {};
    if (search) {
      const sanitized = search.replace(/[%_\\]/g, '\\$&');
      where = [
        { name: Like(`%${sanitized}%`) },
        { email: Like(`%${sanitized}%`) },
      ];
    }

    const [users, total] = await this.userRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      select: [
        'id',
        'name',
        'email',
        'role',
        'accountStatus',
        'isEmailVerified',
        'createdAt',
      ],
    });

    return new PaginatedResponseDto(
      users.map((u) => new AdminUserResponseDto(u)),
      total,
      page,
      limit,
    );
  }

  async findById(id: string): Promise<AdminUserResponseDto> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'id',
        'name',
        'email',
        'role',
        'accountStatus',
        'isEmailVerified',
        'createdAt',
      ],
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return new AdminUserResponseDto(user);
  }

  async findRawById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  // ── WRITE ─────────────────────────────────────────────────────────────────

  @AuditLog('UPDATE_STATUS', 'User')
  async updateStatus(
    userId: string,
    status: AccountStatus,
    _adminId: string,
  ): Promise<AdminUserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot modify another admin account');
    }

    user.accountStatus = status;
    const saved = await this.userRepo.save(user);
    return new AdminUserResponseDto(saved);
  }

  @AuditLog('UPDATE_ROLE', 'User')
  async updateRole(
    userId: string,
    role: UserRole,
    _adminId: string,
  ): Promise<AdminUserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    if (role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot promote to ADMIN via API');
    }

    user.role = role;
    const saved = await this.userRepo.save(user);
    return new AdminUserResponseDto(saved);
  }
}
