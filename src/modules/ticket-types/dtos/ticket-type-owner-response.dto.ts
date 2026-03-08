import { TicketType } from '../entities/ticket-type.entity';

export class TicketTypeOwnerResponseDto {
  id: string;

  name: string;

  price: number;

  quantity: number;

  soldQuantity: number;

  reservedQuantity: number;

  availableQuantity: number;

  revenue: number;

  saleStart?: Date;

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
