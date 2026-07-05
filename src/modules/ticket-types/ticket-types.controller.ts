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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { TicketTypesService } from './ticket-types.service';
import { CreateTicketTypeDto } from './dtos/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dtos/update-ticket-type.dto';
import { OrganizerTicketQueryDto } from './dtos/organizer-ticket-query.dto';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';
import { ApiStandardResponse } from 'src/common/decorators/api-standard-response.decorator';
import { TicketTypeResponseDto } from './dtos/ticket-types-response.dto';
import { TicketTypePublicResponseDto } from './dtos/ticket-type-public-response.dto';
import { TicketTypeOwnerResponseDto } from './dtos/ticket-type-owner-response.dto';

@ApiTags('Ticket Types')
@ApiParam({ name: 'eventId', description: 'Parent event UUID' })
@Controller('events/:eventId/ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  /* -------------------------------------------------------------------------- */
  /*                            PUBLIC ENDPOINTS                                */
  /* -------------------------------------------------------------------------- */

  @Get('manage')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({
    summary:
      'List ticket types for this event, with sold/reserved/revenue details',
    description: 'Organizer only, ownership enforced.',
  })
  @ApiStandardResponse({
    model: TicketTypeOwnerResponseDto,
    isArray: true,
    description: 'Ticket types fetched successfully',
  })
  @ResponseMessage('Ticket types fetched successfully')
  getOwnerTickets(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
    @Query() query: OrganizerTicketQueryDto,
  ) {
    return this.ticketTypesService.getOwnerTicketTypes(eventId, userId, query);
  }

  @Get()
  @ApiOperation({
    summary: 'List publicly available ticket types for a published event',
    description:
      'Only returns ticket types currently within their sale window and with stock left.',
  })
  @ApiStandardResponse({ model: TicketTypePublicResponseDto, isArray: true })
  getPublicTickets(@Param('eventId') eventId: string) {
    return this.ticketTypesService.getPublicTicketTypes(eventId);
  }

  /* -------------------------------------------------------------------------- */
  /*                          ORGANIZER ENDPOINTS                               */
  /* -------------------------------------------------------------------------- */

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiOperation({
    summary: 'Create a ticket type for a draft event',
    description:
      'Event must still be DRAFT. Sale window (if provided) is validated against event dates.',
  })
  @ApiStandardResponse({
    model: TicketTypeResponseDto,
    status: 201,
    description: 'Ticket type created successfully',
  })
  @ResponseMessage('Ticket type created successfully')
  create(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTicketTypeDto,
  ) {
    return this.ticketTypesService.createTicketType(eventId, userId, dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiParam({ name: 'id', description: 'Ticket type UUID' })
  @ApiOperation({
    summary: 'Update a ticket type',
    description:
      'Price and sale-window changes are blocked once tickets have been sold or reserved. ' +
      'Quantity cannot go below the already committed amount.',
  })
  @ApiStandardResponse({
    model: TicketTypeResponseDto,
    description: 'Ticket type updated successfully',
  })
  @ResponseMessage('Ticket type updated successfully')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTicketTypeDto,
  ) {
    return this.ticketTypesService.updateTicketType(id, userId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @ApiParam({ name: 'id', description: 'Ticket type UUID' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a ticket type',
    description:
      'Only allowed while the event is DRAFT and no tickets have been sold or reserved.',
  })
  @ApiStandardResponse({ description: 'Ticket type deleted successfully' })
  @ResponseMessage('Ticket type deleted successfully')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ticketTypesService.deleteTicketType(id, userId);
  }
}
