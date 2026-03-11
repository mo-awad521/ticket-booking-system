import { Ticket } from '../entities/ticket.entity';

export class TicketResponseDto {
  id: string;
  code: string;
  qrCodeUrl: string | null;
  status: string;
  orderId: string;
  ticketTypeId: string;

  constructor(ticket: Ticket) {
    this.id = ticket.id;
    this.code = ticket.code;
    this.qrCodeUrl = ticket.qrCodeUrl ?? null;
    this.status = ticket.status;
    this.orderId = ticket.orderId;
    this.ticketTypeId = ticket.ticketTypeId;
  }
}
