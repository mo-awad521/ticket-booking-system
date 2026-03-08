import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { TicketTypesService } from './ticket-types.service';
import { CreateTicketTypeDto } from './dtos/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dtos/update-ticket-type.dto';
import { OrganizerTicketQueryDto } from './dtos/organizer-ticket-query.dto';

@Controller('events/:eventId/ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  /* -------------------------------------------------------------------------- */
  /*                            PUBLIC ENDPOINTS                                */
  /* -------------------------------------------------------------------------- */

  @Get('manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  getOwnerTickets(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
    @Query() query: OrganizerTicketQueryDto,
  ) {
    return this.ticketTypesService.getOwnerTicketTypes(eventId, userId, query);
  }

  @Get()
  getPublicTickets(@Param('eventId') eventId: string) {
    return this.ticketTypesService.getPublicTicketTypes(eventId);
  }

  /* -------------------------------------------------------------------------- */
  /*                          ORGANIZER ENDPOINTS                               */
  /* -------------------------------------------------------------------------- */

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  create(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTicketTypeDto,
  ) {
    return this.ticketTypesService.createTicketType(eventId, userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTicketTypeDto,
  ) {
    return this.ticketTypesService.updateTicketType(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ticketTypesService.deleteTicketType(id, userId);
  }
}
