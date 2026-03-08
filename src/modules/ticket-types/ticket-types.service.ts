import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTicketTypeDto } from './dtos/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dtos/update-ticket-type.dto';
import { OrganizerTicketQueryDto } from './dtos/organizer-ticket-query.dto';
import { Event, EventStatus } from '../events/entities/event.entity';
import { TicketType } from './entities/ticket-type.entity';
import { TicketTypeResponseDto } from './dtos/ticket-types-response.dto';
import { TicketTypePublicResponseDto } from './dtos/ticket-type-public-response.dto';
import { TicketTypeOwnerResponseDto } from './dtos/ticket-type-owner-response.dto';

@Injectable()
export class TicketTypesService {
  constructor(
    @InjectRepository(TicketType)
    private readonly ticketRepo: Repository<TicketType>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                           Create Ticket Type                               */
  /* -------------------------------------------------------------------------- */

  async createTicketType(
    eventId: string,
    userId: string,
    dto: CreateTicketTypeDto,
  ) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });

    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== userId) throw new ForbiddenException();

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot add ticket types to a non-draft event',
      );
    }

    /* ----------------------- Sale Window Validation ----------------------- */

    if (dto.saleStart !== undefined || dto.saleEnd !== undefined) {
      const saleStart = dto.saleStart ? new Date(dto.saleStart) : null;
      const saleEnd = dto.saleEnd ? new Date(dto.saleEnd) : null;
      const now = new Date();

      if (saleStart && saleStart <= now) {
        throw new BadRequestException('saleStart must be in the future');
      }

      if (saleStart && saleEnd && saleEnd <= saleStart) {
        throw new BadRequestException('saleEnd must be after saleStart');
      }

      if (saleEnd && saleEnd > event.endDate) {
        throw new BadRequestException('saleEnd cannot exceed event end date');
      }

      if (saleStart && saleStart >= event.startDate) {
        throw new BadRequestException('saleStart must be before event start');
      }
    }

    /* --------------------------- Create & Save ---------------------------- */
    const ticket = this.ticketRepo.create({
      ...dto,
      saleStart: dto.saleStart ? new Date(dto.saleStart) : undefined,
      saleEnd: dto.saleEnd ? new Date(dto.saleEnd) : undefined,
      event,
    });

    const saved = await this.ticketRepo.save(ticket);
    return new TicketTypeResponseDto(saved);
  }

  /* -------------------------------------------------------------------------- */
  /*                           Update Ticket Type                               */
  /* -------------------------------------------------------------------------- */

  async updateTicketType(
    ticketTypeId: string,
    userId: string,
    dto: UpdateTicketTypeDto,
  ) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketTypeId },
      relations: ['event'],
    });

    if (!ticket) throw new NotFoundException('Ticket type not found');

    const event = ticket.event;

    if (event.organizerId !== userId) throw new ForbiddenException();

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot modify ticket types after event is published',
      );
    }

    const totalCommitted = ticket.soldQuantity + ticket.reservedQuantity;

    /* ----------------------- Rule 1: Quantity ----------------------------- */
    if (dto.quantity !== undefined && dto.quantity < totalCommitted) {
      throw new BadRequestException(
        `Quantity cannot be less than committed amount (${totalCommitted})`,
      );
    }

    /* ----------------------- Rule 2: Price -------------------------------- */
    if (
      dto.price !== undefined &&
      (ticket.soldQuantity > 0 || ticket.reservedQuantity > 0)
    ) {
      throw new BadRequestException(
        'Cannot change price after tickets have been sold or reserved',
      );
    }

    /* ----------------------- Rule 3: Sale Window -------------------------- */
    if (dto.saleStart !== undefined || dto.saleEnd !== undefined) {
      if (totalCommitted > 0) {
        throw new BadRequestException(
          'Cannot change sale period after sales have started',
        );
      }

      const saleStart =
        dto.saleStart !== undefined
          ? dto.saleStart
            ? new Date(dto.saleStart)
            : null
          : ticket.saleStart;

      const saleEnd =
        dto.saleEnd !== undefined
          ? dto.saleEnd
            ? new Date(dto.saleEnd)
            : null
          : ticket.saleEnd;

      if (saleStart && saleEnd && saleEnd <= saleStart) {
        throw new BadRequestException('saleEnd must be after saleStart');
      }

      if (saleEnd && saleEnd > event.endDate) {
        throw new BadRequestException('saleEnd cannot exceed event end date');
      }

      if (saleStart && saleStart >= event.startDate) {
        throw new BadRequestException('saleStart must be before event start');
      }
    }

    /* ------------------------- Apply Updates ------------------------------ */
    if (dto.name !== undefined) ticket.name = dto.name;
    if (dto.price !== undefined) ticket.price = dto.price;
    if (dto.quantity !== undefined) ticket.quantity = dto.quantity;

    if (dto.saleStart !== undefined)
      ticket.saleStart = dto.saleStart ? new Date(dto.saleStart) : null;
    if (dto.saleEnd !== undefined)
      ticket.saleEnd = dto.saleEnd ? new Date(dto.saleEnd) : null;

    const saved = await this.ticketRepo.save(ticket);
    return new TicketTypeResponseDto(saved);
  }

  /* -------------------------------------------------------------------------- */
  /*                           Delete Ticket Type                               */
  /* -------------------------------------------------------------------------- */

  async deleteTicketType(
    ticketTypeId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketTypeId },
      relations: ['event'],
    });

    if (!ticket) throw new NotFoundException('Ticket type not found');

    const event = ticket.event;

    if (event.organizerId !== userId)
      throw new ForbiddenException('Access denied');

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot delete ticket type after event is published',
      );
    }

    if (ticket.soldQuantity > 0 || ticket.reservedQuantity > 0) {
      throw new BadRequestException(
        'Cannot delete ticket type with sold or reserved tickets',
      );
    }

    await this.ticketRepo.remove(ticket);
    return { message: 'Ticket type deleted successfully' };
  }

  /* -------------------------------------------------------------------------- */
  /*                         Get Public Ticket Types                            */
  /* -------------------------------------------------------------------------- */

  async getPublicTicketTypes(eventId: string) {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, status: EventStatus.PUBLISHED },
    });

    if (!event) throw new NotFoundException('Event not found');

    const now = new Date();

    const tickets = await this.ticketRepo
      .createQueryBuilder('ticket')
      .select([
        'ticket.id',
        'ticket.name',
        'ticket.price',
        'ticket.quantity',
        'ticket.soldQuantity',
        'ticket.reservedQuantity',
        //'ticket.availableQuantity',
        'ticket.saleStart',
        'ticket.saleEnd',
      ])
      .where('ticket.eventId = :eventId', { eventId })
      .andWhere('(ticket.saleStart IS NULL OR ticket.saleStart <= :now)', {
        now,
      })
      .andWhere('(ticket.saleEnd   IS NULL OR ticket.saleEnd   >= :now)', {
        now,
      })
      .andWhere(
        '(ticket.quantity - ticket.soldQuantity - ticket.reservedQuantity) > 0',
      )
      .orderBy('ticket.price', 'ASC')
      .getMany();

    return tickets.map((ticket) => new TicketTypePublicResponseDto(ticket));
  }

  /* -------------------------------------------------------------------------- */
  /*                         Get Owner Ticket Types                             */
  /* -------------------------------------------------------------------------- */

  async getOwnerTicketTypes(
    eventId: string,
    userId: string,
    query: OrganizerTicketQueryDto,
  ) {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, organizerId: userId },
    });

    if (!event) throw new NotFoundException('Event not found');

    const { page, limit } = query;

    const [tickets, total] = await this.ticketRepo.findAndCount({
      where: { eventId },
      select: {
        id: true,
        name: true,
        price: true,
        quantity: true,
        soldQuantity: true,
        reservedQuantity: true,
        //availableQuantity: true,
        saleStart: true,
        saleEnd: true,
      },
      order: { price: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: tickets.map((ticket) => new TicketTypeOwnerResponseDto(ticket)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
