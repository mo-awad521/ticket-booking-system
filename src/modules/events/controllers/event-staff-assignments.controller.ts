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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AssignStaffDto } from '../dtos/assign-staff.dto';
import { EventStaffAssignmentsService } from '../services/event-staff-assignments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
@Controller('events/:eventId/staff')
export class EventStaffAssignmentsController {
  constructor(
    private readonly assignmentsService: EventStaffAssignmentsService,
  ) {}

  // POST /events/:eventId/staff
  @Post()
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
  removeStaff(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentUser('id') organizerId: string,
  ) {
    return this.assignmentsService.removeStaff(eventId, staffId, organizerId);
  }

  // GET /events/:eventId/staff
  @Get()
  listStaff(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') organizerId: string,
  ) {
    return this.assignmentsService.listStaff(eventId, organizerId);
  }
}
