import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketType } from '../entities/ticket-type.entity';

export class TicketTypeOwnerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  soldQuantity: number;

  @ApiProperty()
  reservedQuantity: number;

  @ApiProperty()
  availableQuantity: number;

  @ApiProperty({ description: 'price * soldQuantity' })
  revenue: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  saleStart?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  saleEnd?: Date;

  constructor(ticket: TicketType) {
    this.id = ticket.id;
    this.name = ticket.name;

    this.price = Number(ticket.price);
    this.quantity = ticket.quantity;

    this.soldQuantity = ticket.soldQuantity;
    this.reservedQuantity = ticket.reservedQuantity;

    this.availableQuantity =
      ticket.quantity - ticket.soldQuantity - ticket.reservedQuantity;

    this.revenue = this.price * this.soldQuantity;

    this.saleStart = ticket.saleStart ?? undefined;
    this.saleEnd = ticket.saleEnd ?? undefined;
  }
}
