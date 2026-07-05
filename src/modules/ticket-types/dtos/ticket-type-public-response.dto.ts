import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketType } from '../entities/ticket-type.entity';

export class TicketTypePublicResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  availableQuantity: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  saleStart?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  saleEnd?: Date;

  constructor(ticket: TicketType) {
    this.id = ticket.id;
    this.name = ticket.name;
    this.price = Number(ticket.price);
    this.availableQuantity =
      ticket.quantity - ticket.soldQuantity - ticket.reservedQuantity;
    this.saleStart = ticket.saleStart ?? undefined;
    this.saleEnd = ticket.saleEnd ?? undefined;
  }
}
