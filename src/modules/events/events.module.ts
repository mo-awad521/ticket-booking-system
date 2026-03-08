import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Event } from './entities/event.entity';

import { EventsService } from './events.service';
import { TicketTypesService } from '../ticket-types/ticket-types.service';

import { EventsController } from './events.controller';
import { TicketTypesController } from '../ticket-types/ticket-types.controller';
import { TicketType } from '../ticket-types/entities/ticket-type.entity';
import { CloudinaryService } from '../media/services/cloudinary.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, TicketType]), MediaModule],
  controllers: [EventsController, TicketTypesController],
  providers: [EventsService, TicketTypesService, CloudinaryService],
  exports: [EventsService],
})
export class EventsModule {}
