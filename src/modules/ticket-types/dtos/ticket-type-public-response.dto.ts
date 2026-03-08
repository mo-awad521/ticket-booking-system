import { TicketType } from '../entities/ticket-type.entity';

export class TicketTypePublicResponseDto {
  id: string;

  name: string;

  price: number;

  availableQuantity: number;

  saleStart?: Date;

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
