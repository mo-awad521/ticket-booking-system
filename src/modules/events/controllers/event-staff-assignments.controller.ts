import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AssignStaffDto } from '../dtos/assign-staff.dto';
import { EventStaffAssignmentsService } from '../services/event-staff-assignments.service';
import { ResponseMessage } from 'src/common/filters/transform.interceptor';
import { ApiStandardResponse } from 'src/common/decorators/api-standard-response.decorator';

@ApiTags('Event Staff')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
@ApiParam({ name: 'eventId', description: 'Target event UUID' })
@Controller('events/:eventId/staff')
export class EventStaffAssignmentsController {
  constructor(
    private readonly assignmentsService: EventStaffAssignmentsService,
  ) {}

  // POST /events/:eventId/staff
  @Post()
  @ApiOperation({
    summary: 'Assign a staff member to scan tickets for this event',
  })
  @ApiStandardResponse({ status: 201, description: 'Staff added successfully' })
  @ResponseMessage('Staff added successfully')
  assignStaff(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: AssignStaffDto,
    @CurrentUser('id') organizerId: string,
  ) {
    return this.assignmentsService.assignStaff(
      eventId,
      dto.staffId,
      organizerId,
    );
  }

  // DELETE /events/:eventId/staff/:staffId
  @Delete(':staffId')
  @ApiOperation({ summary: 'Deactivate a staff assignment for this event' })
  @ApiStandardResponse({ description: 'Staff removed from event' })
  @ResponseMessage('Staff removed from event')
  removeStaff(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentUser('id') organizerId: string,
  ) {
    return this.assignmentsService.removeStaff(eventId, staffId, organizerId);
  }

  // GET /events/:eventId/staff
  @Get()
  @ApiOperation({ summary: 'List active staff assignments for this event' })
  @ApiStandardResponse({ description: 'Staff fetched successfully' })
  @ResponseMessage('Staff fetched successfully')
  listStaff(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') organizerId: string,
  ) {
    return this.assignmentsService.listStaff(eventId, organizerId);
  }
}
