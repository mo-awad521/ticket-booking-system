import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventStaffAssignment } from '../entities/event-staff-assignment.entity';
import { Event } from '../entities/event.entity';

@Injectable()
export class EventStaffAssignmentsService {
  constructor(
    @InjectRepository(EventStaffAssignment)
    private readonly assignmentRepo: Repository<EventStaffAssignment>,

    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async assignStaff(eventId: string, staffId: string, requesterId: string) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.organizerId !== requesterId) {
      throw new ForbiddenException('Only the event organizer can assign staff');
    }

    const existing = await this.assignmentRepo.findOne({
      where: { staffId, eventId },
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.deactivatedAt = null;
        return this.assignmentRepo.save(existing);
      }
      throw new BadRequestException('Staff already assigned to this event');
    }

    const assignment = this.assignmentRepo.create({ staffId, eventId });
    return this.assignmentRepo.save(assignment);
  }

  async removeStaff(eventId: string, staffId: string, requesterId: string) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.organizerId !== requesterId) {
      throw new ForbiddenException('Only the event organizer can remove staff');
    }

    const assignment = await this.assignmentRepo.findOne({
      where: { staffId, eventId, isActive: true },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    assignment.isActive = false;
    assignment.deactivatedAt = new Date();
    await this.assignmentRepo.save(assignment);

    return { message: 'Staff removed from event' };
  }

  async listStaff(eventId: string, requesterId: string) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.organizerId !== requesterId) {
      throw new ForbiddenException('Only the event organizer can view staff');
    }

    const staffList = this.assignmentRepo.find({
      where: { eventId, isActive: true },
      select: ['id', 'staffId', 'eventId', 'createdAt'],
      relations: ['staff'],
      order: { createdAt: 'ASC' },
    });
    return staffList;
  }
}
