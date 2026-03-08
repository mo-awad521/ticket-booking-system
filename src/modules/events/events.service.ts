import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Event, EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dtos/create-event.dto';
import { UpdateEventDto } from './dtos/update-event.dto';
import { QueryEventsDto } from './dtos/query-event.dto';
import { OrganizerEventsQueryDto } from './dtos/organizer-events-query.dto';
import { CloudinaryService } from '../media/services/cloudinary.service';
import { EventResponseDto } from './dtos/evnet.response.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,

    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                              Create Event                                  */
  /* -------------------------------------------------------------------------- */

  async createEvent(
    userId: string,
    dto: CreateEventDto,
    file?: Express.Multer.File,
  ) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const now = new Date();

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    if (start <= now) {
      throw new BadRequestException('Event must start in the future');
    }

    const baseSlug = this.generateSlug(dto.title);
    const slug = await this.ensureUniqueSlug(baseSlug);

    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadImage(file, 'events');
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    try {
      const event = this.eventRepo.create({
        title: dto.title,
        description: dto.description,
        location: dto.location,
        slug,
        imageUrl,
        imagePublicId,
        startDate: start,
        endDate: end,
        organizer: { id: userId },
        status: EventStatus.DRAFT,
      });

      const saved = await this.eventRepo.save(event);
      return new EventResponseDto(saved);
    } catch (error) {
      if (imagePublicId) {
        await this.cloudinaryService.deleteImage(imagePublicId).catch(() => {});
      }
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              Update Event                                  */
  /* -------------------------------------------------------------------------- */

  async updateEvent(
    eventId: string,
    userId: string,
    dto: UpdateEventDto,
    file?: Express.Multer.File,
  ) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });

    if (!event) throw new NotFoundException('Event not found');

    /* ------------------------- Ownership Check ------------------------- */
    if (event.organizerId !== userId) {
      throw new ForbiddenException('You are not allowed to edit this event');
    }

    /* ------------------- Prevent Editing Published Event --------------- */
    if (event.status === EventStatus.PUBLISHED) {
      throw new BadRequestException('Published events cannot be edited');
    }

    /* -------------------------- Validate Dates ------------------------- */
    const newStart = dto.startDate ? new Date(dto.startDate) : event.startDate;
    const newEnd = dto.endDate ? new Date(dto.endDate) : event.endDate;

    if (newEnd <= newStart) {
      throw new BadRequestException('End date must be after start date');
    }

    event.startDate = newStart;
    event.endDate = newEnd;

    /* ------------------------- Update Basic Fields --------------------- */
    if (dto.title) {
      event.title = dto.title;
      const baseSlug = this.generateSlug(dto.title);
      event.slug = await this.ensureUniqueSlug(baseSlug, eventId);
    }
    if (dto.description) event.description = dto.description;
    if (dto.location) event.location = dto.location;

    /* --------------------------- Replace Image ------------------------- */
    let oldPublicId: string | undefined;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadImage(file, 'events');
      oldPublicId = event.imagePublicId;
      event.imageUrl = uploaded.url;
      event.imagePublicId = uploaded.publicId;
    }

    /* ------------------------------ Save ------------------------------- */
    try {
      const saved = await this.eventRepo.save(event);

      if (oldPublicId) {
        await this.cloudinaryService.deleteImage(oldPublicId).catch(() => {});
      }

      return new EventResponseDto(saved);
    } catch (error) {
      if (file && event.imagePublicId) {
        await this.cloudinaryService
          .deleteImage(event.imagePublicId)
          .catch(() => {});
      }
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                             Publish Event                                  */
  /* -------------------------------------------------------------------------- */

  async publishEvent(eventId: string, userId: string) {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['ticketTypes'],
    });

    if (!event) throw new NotFoundException('Event not found');

    /* ------------------------- Ownership Check ------------------------- */
    if (event.organizerId !== userId) {
      throw new ForbiddenException('You are not allowed to publish this event');
    }

    /* ------------------------- Status Validation ----------------------- */
    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only draft events can be published');
    }

    /* ----------------------- Required Fields Check --------------------- */
    const errors: string[] = [];

    if (!event.imageUrl) errors.push('Event must have an image');

    if (event.startDate <= new Date())
      errors.push('Event must start in the future');

    if (!event.ticketTypes?.length)
      errors.push('Event must have at least one ticket type');

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    /* ---------------------------- Publish ------------------------------ */
    event.status = EventStatus.PUBLISHED;
    event.publishedAt = new Date();

    const saved = await this.eventRepo.save(event);
    return new EventResponseDto(saved);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Cancel Event                                  */
  /* -------------------------------------------------------------------------- */

  async cancelEvent(eventId: string, userId: string) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });

    if (!event) throw new NotFoundException('Event not found');

    /* ------------------------- Ownership Check ------------------------- */
    if (event.organizerId !== userId) {
      throw new ForbiddenException('You are not allowed to cancel this event');
    }

    /* ------------------------- Status Validation ----------------------- */
    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Only published events can be cancelled');
    }

    if (event.startDate <= new Date()) {
      throw new BadRequestException(
        'Cannot cancel an event that already started',
      );
    }

    event.status = EventStatus.CANCELLED;
    event.cancelledAt = new Date();

    const saved = await this.eventRepo.save(event);

    return new EventResponseDto(saved);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Delete Event                                  */
  /* -------------------------------------------------------------------------- */

  async deleteEvent(eventId: string, userId: string) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });

    if (!event) throw new NotFoundException('Event not found');

    /* ------------------------- Ownership Check ------------------------- */
    if (event.organizerId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this event');
    }

    /* ------------------------- Business Rules -------------------------- */
    const deletableStatuses = [EventStatus.DRAFT];
    if (!deletableStatuses.includes(event.status)) {
      throw new BadRequestException(
        `Events with status "${event.status}" cannot be deleted`,
      );
    }

    if (event.startDate <= new Date()) {
      throw new BadRequestException(
        'Cannot delete an event that already started',
      );
    }

    /* -------------------------- Soft Delete ---------------------------- */
    const imagePublicId = event.imagePublicId;

    await this.eventRepo.softDelete(event.id);

    if (imagePublicId) {
      await this.cloudinaryService.deleteImage(imagePublicId).catch(() => {});
    }

    return { message: 'Event deleted successfully' };
  }

  /* -------------------------------------------------------------------------- */
  /*                           Get Public Events                                */
  /* -------------------------------------------------------------------------- */

  async getPublicEvents(query: QueryEventsDto) {
    const { page, limit, search, location, sort } = query;

    const qb = this.eventRepo
      .createQueryBuilder('event')
      .select([
        'event.id',
        'event.title',
        'event.slug',
        'event.description',
        'event.location',
        'event.imageUrl',
        'event.startDate',
        'event.endDate',
        'event.status',
      ])
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.startDate > :now', { now: new Date() });

    /* ------------------------------ Search ----------------------------- */
    if (search) {
      const safeSearch = search.replace(/[%_\\]/g, '\\$&');
      qb.andWhere('event.title ILIKE :search', {
        search: `%${safeSearch}%`,
      });
    }

    /* ------------------------------ Filter ----------------------------- */
    if (location) {
      const safeLocation = location.replace(/[%_\\]/g, '\\$&');
      qb.andWhere('event.location ILIKE :location', {
        location: `%${safeLocation}%`,
      });
    }

    /* ------------------------------ Sorting ---------------------------- */
    const sortOrder = sort === 'DESC' ? 'DESC' : 'ASC';
    qb.orderBy('event.startDate', sortOrder);

    /* --------------------------- Pagination ---------------------------- */
    qb.skip((page - 1) * limit).take(limit);

    const [events, total] = await qb.getManyAndCount();

    return {
      data: events.map((event) => new EventResponseDto(event)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(eventId: string) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!(event.status === EventStatus.PUBLISHED)) {
      return new BadRequestException('You can get only published events');
    }

    return new EventResponseDto(event);
  }

  /* -------------------------------------------------------------------------- */
  /*                          Get Organizer Events                              */
  /* -------------------------------------------------------------------------- */

  async getOrganizerEvents(userId: string, query: OrganizerEventsQueryDto) {
    const { status, page, limit } = query;

    const [events, total] = await this.eventRepo.findAndCount({
      where: {
        organizerId: userId,
        ...(status && { status }),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        startDate: true,
        endDate: true,
        imageUrl: true,
        createdAt: true,
        ticketTypes: {
          id: true,
          name: true,
          price: true,
          //capacity: true,
        },
      },
      relations: ['ticketTypes'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: events.map((event) => new EventResponseDto(event)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                              Helper Methods                                */
  /* -------------------------------------------------------------------------- */

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async ensureUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const qb = this.eventRepo
        .createQueryBuilder('event')
        .where('event.slug = :slug', { slug });

      if (excludeId) {
        qb.andWhere('event.id != :excludeId', { excludeId });
      }

      const existing = await qb.getOne();
      if (!existing) break;

      slug = `${baseSlug}-${counter++}`;
    }

    return slug;
  }
}
