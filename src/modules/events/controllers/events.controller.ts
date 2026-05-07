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

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /* -------------------------------------------------------------------------- */
  /*                            PUBLIC ENDPOINTS                                */
  /* -------------------------------------------------------------------------- */

  @Get('public')
  @ResponseMessage('Events fetched successfully')
  getPublicEvents(@Query() query: QueryEventsDto) {
    return this.eventsService.getPublicEvents(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  @ResponseMessage('Events fetched successfully')
  async getMyEvents(
    @CurrentUser('id') userId: string,
    @Query() query: OrganizerEventsQueryDto,
  ) {
    return this.eventsService.getOrganizerEvents(userId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  /* -------------------------------------------------------------------------- */
  /*                          ORGANIZER ENDPOINTS                               */
  /* -------------------------------------------------------------------------- */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post()
  @ResponseMessage('Event created successfully')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEventDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventsService.createEvent(userId, dto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch(':id')
  @ResponseMessage('Event updated successfully')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEventDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventsService.updateEvent(id, userId, dto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch(':id/publish')
  @ResponseMessage('Event published successfully')
  publish(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.eventsService.publishEvent(id, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch(':id/cancel')
  @ResponseMessage('Event cancelled successfully')
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.eventsService.cancelEvent(id, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete(':id')
  @ResponseMessage('Event deleted successfully')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.eventsService.deleteEvent(id, userId);
  }
}
