// import { Ticket } from '../entities/ticket.entity';

// export class TicketResponseDto {
//   id: string;
//   code: string;
//   qrCodeUrl: string | null;
//   status: string;
//   orderId: string;
//   ticketTypeId: string;
//   ticketNumber: any;
//   ticketType: any;
//   seatInfo: any;

//   constructor(ticket: Ticket) {
//     this.id = ticket.id;
//     this.code = ticket.code;
//     this.qrCodeUrl = ticket.qrCodeUrl ?? null;
//     this.status = ticket.status;
//     this.orderId = ticket.orderId;
//     this.ticketTypeId = ticket.ticketTypeId;
//   }
// }

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ticket } from '../entities/ticket.entity';

export class TicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Cloudinary URL of the QR code image',
  })
  qrCodeUrl: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
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
