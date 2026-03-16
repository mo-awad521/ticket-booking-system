import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ticket } from '../entities/ticket.entity';
import { TicketStatus } from '../enums/ticket-status.enum';
import { TicketSignatureService } from './ticket-signature.service';
import { ScanTicketResponseDto } from '../dtos/scan-ticket-response.dto';
import {
  TICKET_CHECKED_IN_EVENT,
  TicketCheckedInEvent,
} from '../events/ticket-checked-in.event';
import { EventStaffAssignment } from 'src/modules/events/entities/event-staff-assignment.entity';

@Injectable()
export class TicketValidationService {
  private readonly logger = new Logger(TicketValidationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly signatureService: TicketSignatureService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateTicket(
    qrData: string,
    eventId: string,
    staffId: string,
  ): Promise<ScanTicketResponseDto> {
    const assignmentRepo = this.dataSource.getRepository(EventStaffAssignment);
    const assignment = await assignmentRepo.findOne({
      where: { staffId, eventId, isActive: true },
    });

    if (!assignment) {
      this.logger.warn(
        `Staff ${staffId} attempted to scan event ${eventId} without assignment`,
      );
      throw new ForbiddenException(
        'Not authorized to scan tickets for this event',
      );
    }

    const dotIndex = qrData.indexOf('.');
    const ticketCode = qrData.substring(0, dotIndex);
    const signature = qrData.substring(dotIndex + 1);

    if (
      !ticketCode ||
      !signature ||
      !this.signatureService.verify(ticketCode, signature)
    ) {
      throw new BadRequestException('Invalid ticket signature');
    }

    const checkedInTicket = await this.dataSource.transaction(async (trx) => {
      const ticketRepo = trx.getRepository(Ticket);

      const ticket = await ticketRepo.findOne({
        where: { code: ticketCode },
        lock: { mode: 'pessimistic_write' },
        relations: ['ticketType'],
      });

      if (!ticket) {
        throw new BadRequestException('Invalid ticket');
      }

      if (ticket.eventId !== eventId) {
        this.logger.warn(
          `Ticket ${ticket.id} scanned for wrong event. Expected ${ticket.eventId}, got ${eventId}`,
        );
        throw new BadRequestException('Invalid ticket');
      }

      if (ticket.status !== TicketStatus.VALID) {
        const message =
          ticket.status === TicketStatus.USED
            ? 'Ticket already used'
            : 'Ticket is not valid';
        throw new BadRequestException(message);
      }

      ticket.status = TicketStatus.USED;
      ticket.usedAt = new Date();
      await ticketRepo.save(ticket);

      this.logger.log(
        `Ticket ${ticket.id} checked in by staff ${staffId} at event ${eventId}`,
      );

      return ticket;
    });

    const event: TicketCheckedInEvent = {
      eventId: checkedInTicket.eventId,
      ticketId: checkedInTicket.id,
      staffId,
      usedAt: checkedInTicket.usedAt!,
    };

    this.eventEmitter.emit(TICKET_CHECKED_IN_EVENT, event);

    return new ScanTicketResponseDto(checkedInTicket);
  }
}
