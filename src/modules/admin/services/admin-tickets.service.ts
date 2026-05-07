import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketStatus } from '../../tickets/enums/ticket-status.enum';
import { IAdminTicketReader } from '../interfaces/admin.interfaces';
import {
  AdminTicketResponseDto,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../dtos/admin.dtos';

// ── Query DTO ─────────────────────────────────────────────────────────────────
export class AdminTicketsQueryDto extends PaginationQueryDto {
  eventId?: string;
  status?: TicketStatus;
  userId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// admin/services/admin-tickets.service.ts — NEW
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AdminTicketsService implements IAdminTicketReader {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async findAll(
    query: AdminTicketsQueryDto,
  ): Promise<PaginatedResponseDto<AdminTicketResponseDto>> {
    const { page, limit, eventId, status, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.ticketType', 'tt')
      .orderBy('t.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (eventId) qb.andWhere('t.eventId = :eventId', { eventId });
    if (status) qb.andWhere('t.status   = :status', { status });

    // Search by ticket code
    if (search) {
      const sanitized = search.replace(/[%_\\]/g, '\\$&');
      qb.andWhere('t.code LIKE :code', { code: `%${sanitized}%` });
    }

    const [tickets, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(
      tickets.map((t) => new AdminTicketResponseDto(t)),
      total,
      page,
      limit,
    );
  }

  async findById(id: string): Promise<AdminTicketResponseDto> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['ticketType'],
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return new AdminTicketResponseDto(ticket);
  }
}
