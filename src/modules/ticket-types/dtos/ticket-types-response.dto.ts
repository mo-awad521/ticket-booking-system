import { TicketType } from '../entities/ticket-type.entity';

export class TicketTypeResponseDto {
  id: string;
  name: string;
  price: number;
  quantity: number;
  soldQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  saleStart?: Date;
  saleEnd?: Date;

  constructor(ticket: TicketType) {
    this.id = ticket.id;
    this.name = ticket.name;
    this.price = Number(ticket.price);
    this.quantity = ticket.quantity;
    this.soldQuantity = ticket.soldQuantity;
    this.reservedQuantity = ticket.reservedQuantity;
    this.availableQuantity = ticket.availableQuantity;
    this.saleStart = ticket.saleStart ?? undefined;
    this.saleEnd = ticket.saleEnd ?? undefined;
  }
}
