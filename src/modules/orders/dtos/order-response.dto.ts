import { ApiProperty } from '@nestjs/swagger';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enums/order-status.enum';

export class OrderItemResponseDto {
  @ApiProperty()
  ticketTypeId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ description: 'Price snapshot at order creation time' })
  unitPrice: number;

  @ApiProperty({ description: 'unitPrice * quantity' })
  subtotal: number;

  constructor(item: OrderItem) {
    this.ticketTypeId = item.ticketTypeId;
    this.quantity = item.quantity;
    this.unitPrice = Number(item.unitPrice);
    this.subtotal = Number(item.unitPrice) * item.quantity;
  }
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt: Date;

  @ApiProperty({ type: [OrderItemResponseDto] })
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
