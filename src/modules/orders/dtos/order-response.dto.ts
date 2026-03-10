import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enums/order-status.enum';

export class OrderItemResponseDto {
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;

  constructor(item: OrderItem) {
    this.ticketTypeId = item.ticketTypeId;
    this.quantity = item.quantity;
    this.unitPrice = Number(item.unitPrice);
    this.subtotal = Number(item.unitPrice) * item.quantity;
  }
}

export class OrderResponseDto {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  expiresAt: Date;
  items: OrderItemResponseDto[];

  constructor(order: Order) {
    this.id = order.id;
    this.status = order.status;
    this.totalAmount = Number(order.totalAmount);
    this.currency = order.currency;
    this.expiresAt = order.expiresAt;
    this.items = order.items.map((i) => new OrderItemResponseDto(i));
  }
}
