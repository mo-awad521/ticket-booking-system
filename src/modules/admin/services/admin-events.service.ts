import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, In } from 'typeorm';
import { DataSource } from 'typeorm';
import { Event, EventStatus } from '../../events/entities/event.entity';
import { AuditLog } from '../decorators/audit-log.decorator';
import {
  IAdminEventReader,
  IAdminEventWriter,
} from '../interfaces/admin.interfaces';
import {
  AdminEventResponseDto,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../dtos/admin.dtos';

interface IEventFilterStrategy {
  buildWhere(): FindManyOptions<Event>['where'];
}

class AllEventsStrategy implements IEventFilterStrategy {
  buildWhere() {
    return {};
  }
}

class EventsByStatusStrategy implements IEventFilterStrategy {
  constructor(private readonly status: EventStatus) {}
  buildWhere() {
    return { status: this.status };
  }
}

class EventsByOrganizerStrategy implements IEventFilterStrategy {
  constructor(private readonly organizerId: string) {}
  buildWhere() {
    return { organizerId: this.organizerId };
  }
}

class EventsByStatusAndOrganizerStrategy implements IEventFilterStrategy {
  constructor(
    private readonly status: EventStatus,
    private readonly organizerId: string,
  ) {}
  buildWhere() {
    return { status: this.status, organizerId: this.organizerId };
  }
}

class EventFilterStrategyFactory {
  static create(query: AdminEventsQueryDto): IEventFilterStrategy {
    if (query.status && query.organizerId) {
      return new EventsByStatusAndOrganizerStrategy(
        query.status,
        query.organizerId,
      );
    }
    if (query.status) return new EventsByStatusStrategy(query.status);
    if (query.organizerId)
      return new EventsByOrganizerStrategy(query.organizerId);
    return new AllEventsStrategy();
  }
}

// ── DTO ───────────────────────────────────────────────────────────────────────

export class AdminEventsQueryDto extends PaginationQueryDto {
  status?: EventStatus;
  organizerId?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AdminEventsService
  implements IAdminEventReader, IAdminEventWriter
{
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    readonly dataSource: DataSource,
  ) {}

  async findAll(
    query: AdminEventsQueryDto,
  ): Promise<PaginatedResponseDto<AdminEventResponseDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const strategy = EventFilterStrategyFactory.create(query);

    const [events, total] = await this.eventRepo.findAndCount({
      where: strategy.buildWhere(),
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      select: [
        'id',
        'title',
        'status',
        'location',
        'startDate',
        'endDate',
        'organizerId',
        'createdAt',
      ],
    });

    return new PaginatedResponseDto(
      events.map((e) => new AdminEventResponseDto(e)),
      total,
      page,
      limit,
    );
  }

  async findById(id: string): Promise<AdminEventResponseDto> {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return new AdminEventResponseDto(event);
  }

  @AuditLog('FORCE_CANCEL', 'Event')
  async forceCancel(
    eventId: string,
    _reason: string,
    _adminId: string,
  ): Promise<AdminEventResponseDto> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    if (event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Event is already cancelled');
    }

    event.status = EventStatus.CANCELLED;
    const saved = await this.eventRepo.save(event);
    return new AdminEventResponseDto(saved);
  }

  async cancelAllByOrganizer(
    organizerId: string,
    _adminId: string,
  ): Promise<number> {
    const result = await this.eventRepo.update(
      {
        organizerId,
        status: In([EventStatus.PUBLISHED, EventStatus.DRAFT]),
      },
      { status: EventStatus.CANCELLED },
    );
    return result.affected ?? 0;
  }
}
