import { Ticket } from '../entities/ticket.entity';

export class ScanTicketResponseDto {
  ticketId: string;
  status: 'checked_in';
  checkedInAt: Date;
  ticketTypeName: string | null;

  constructor(ticket: Ticket) {
    this.ticketId = ticket.id;
    this.status = 'checked_in';
    this.checkedInAt = ticket.usedAt!;
    this.ticketTypeName = ticket.ticketType?.name ?? null;
  }
}
