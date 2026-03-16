export const TICKET_CHECKED_IN_EVENT = 'ticket.checked_in' as const;

export class TicketCheckedInEvent {
  eventId: string;
  ticketId: string;
  staffId: string;
  usedAt: Date;
}
