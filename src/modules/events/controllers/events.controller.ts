import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  Query,
  UseGuards,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

import { CreateEventDto } from '../dtos/create-event.dto';
import { QueryEventsDto } from '../dtos/query-event.dto';
import { UpdateEventDto } from '../dtos/update-event.dto';
import { OrganizerEventsQueryDto } from '../dtos/organizer-events-query.dto';
import { EventsService } from '../services/events.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { multerOptions } from '../../media/cloudinary.multer';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';
import { ApiStandardResponse } from 'src/common/decorators/api-standard-response.decorator';
import { EventResponseDto } from '../dtos/evnet.response.dto';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /* -------------------------------------------------------------------------- */
  /*                            PUBLIC ENDPOINTS                                */
  /* -------------------------------------------------------------------------- */

  @Get('public')
  @ApiOperation({
    summary: 'List published, upcoming events (public)',
    description:
      'Supports search, location filter, sorting and pagination. No auth required.',
  })
  @ApiStandardResponse({
    model: EventResponseDto,
    isArray: true,
    description: 'Events fetched successfully',
  })
  @ResponseMessage('Events fetched successfully')
  getPublicEvents(@Query() query: QueryEventsDto) {
    return this.eventsService.getPublicEvents(query);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('my')
  @ApiOperation({ summary: "List the current organizer's events (any status)" })
  @ApiStandardResponse({
    model: EventResponseDto,
    isArray: true,
    description: 'Events fetched successfully',
  })
  @ResponseMessage('Events fetched successfully')
  async getMyEvents(
    @CurrentUser('id') userId: string,
    @Query() query: OrganizerEventsQueryDto,
  ) {
    return this.eventsService.getOrganizerEvents(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single published event by id (public)' })
  @ApiStandardResponse({ model: EventResponseDto })
  async findOne(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get('my/:id')
  @ApiOperation({ summary: 'Get a single Event' })
  @ApiStandardResponse({ model: EventResponseDto })
  async findMyEvent(@Param('id') id: string) {
    return this.eventsService.findMyEvent(id);
  }

  /* -------------------------------------------------------------------------- */
  /*                          ORGANIZER ENDPOINTS                               */
  /* -------------------------------------------------------------------------- */

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post()
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Event fields plus an optional cover image',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'NestJS Conference 2026' },
        description: {
          type: 'string',
          example: 'A one-day conference about NestJS.',
        },
        location: { type: 'string', example: 'Amman, Jordan' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Cover image, max 5MB',
        },
      },
      required: ['title', 'location', 'startDate', 'endDate'],
    },
  })
  @ApiOperation({
    summary: 'Create a new event (DRAFT status)',
    description: 'Organizer only. Image upload is optional at creation time.',
  })
  @ApiStandardResponse({
    model: EventResponseDto,
    status: 201,
    description: 'Event created successfully',
  })
  @ResponseMessage('Event created successfully')
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEventDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventsService.createEvent(userId, dto, file);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Partial update of event fields plus an optional new cover image',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        location: { type: 'string' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Update a draft event',
    description:
      'Organizer only, ownership enforced. Published events cannot be edited.',
  })
  @ApiStandardResponse({
    model: EventResponseDto,
    description: 'Event updated successfully',
  })
  @ResponseMessage('Event updated successfully')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEventDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventsService.updateEvent(id, userId, dto, file);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch(':id/publish')
  @ApiOperation({
    summary: 'Publish a draft event',
    description:
      'Requires: an image, a start date in the future, and at least one ticket type.',
  })
  @ApiStandardResponse({
    model: EventResponseDto,
    description: 'Event published successfully',
  })
  @ResponseMessage('Event published successfully')
  publish(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.eventsService.publishEvent(id, userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel a published event',
    description: 'Only allowed before the event start date.',
  })
  @ApiStandardResponse({
    model: EventResponseDto,
    description: 'Event cancelled successfully',
  })
  @ResponseMessage('Event cancelled successfully')
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.eventsService.cancelEvent(id, userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete(':id')
  @ApiOperation({
    summary: 'Soft-delete a draft event',
    description: 'Only DRAFT events that have not started can be deleted.',
  })
  @ApiStandardResponse({ description: 'Event deleted successfully' })
  @ResponseMessage('Event deleted successfully')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.eventsService.deleteEvent(id, userId);
  }
}
