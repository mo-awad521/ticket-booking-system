import { ApiProperty } from '@nestjs/swagger';
import { Ticket } from '../entities/ticket.entity';

export class ScanTicketResponseDto {
  @ApiProperty()
  ticketId: string;

  @ApiProperty({ enum: ['checked_in'], example: 'checked_in' })
  status: 'checked_in';

  @ApiProperty({ type: String, format: 'date-time' })
  checkedInAt: Date;

  @ApiProperty({ nullable: true })
  ticketTypeName: string | null;

  constructor(ticket: Ticket) {
    this.ticketId = ticket.id;
    this.status = 'checked_in';
    this.checkedInAt = ticket.usedAt!;
    this.ticketTypeName = ticket.ticketType?.name ?? null;
  }
}
