import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Event } from './entities/event.entity';

import { EventsService } from './services/events.service';
import { TicketTypesService } from '../ticket-types/ticket-types.service';

import { EventsController } from './controllers/events.controller';
import { TicketTypesController } from '../ticket-types/ticket-types.controller';
import { TicketType } from '../ticket-types/entities/ticket-type.entity';
import { CloudinaryService } from '../media/services/cloudinary.service';
import { MediaModule } from '../media/media.module';
import { EventStaffAssignmentsController } from './controllers/event-staff-assignments.controller';
import { EventStaffAssignment } from './entities/event-staff-assignment.entity';
import { EventStaffAssignmentsService } from './services/event-staff-assignments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, TicketType, EventStaffAssignment]),
    MediaModule,
  ],
  controllers: [
    EventsController,
    EventStaffAssignmentsController,
    TicketTypesController,
  ],
  providers: [
    EventsService,
    EventStaffAssignmentsService,
    TicketTypesService,
    CloudinaryService,
  ],
  exports: [EventsService],
})
export class EventsModule {}
