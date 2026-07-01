import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationStatus } from '../reservations/enums/reservation-status.enum';
import { TicketType } from '../ticket-types/entities/ticket-type.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { OrderResponseDto } from './dtos/order-response.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { ReservationItem } from '../reservations/entities/reservation-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                              Create Order                                  */
  /* -------------------------------------------------------------------------- */

  // orders.service.ts

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(Reservation);
      const reservationItemRepo = manager.getRepository(ReservationItem);
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);
      const ticketRepo = manager.getRepository(TicketType);

      const reservation = await reservationRepo.findOne({
        where: {
          id: dto.reservationId,
          userId,
          status: ReservationStatus.ACTIVE,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found or already used');
      }

      if (reservation.expiresAt < new Date()) {
        throw new BadRequestException('Reservation has expired');
      }

      // ── Step 2: Fetch items منفصلاً (نفس الـ transaction) ────────────────
      const items = await reservationItemRepo.find({
        where: { reservationId: reservation.id },
      });

      if (!items.length) {
        throw new BadRequestException('Reservation is empty');
      }

      // ── Step 3: Lock ticket types
      const ticketIds = items.map((i) => i.ticketTypeId);

      const tickets = await ticketRepo
        .createQueryBuilder('t')
        .whereInIds(ticketIds)
        .setLock('pessimistic_write')
        .getMany();

      if (tickets.length !== ticketIds.length) {
        throw new NotFoundException('One or more ticket types not found');
      }

      // ── Step 4: Build order ───────────────────────────────────────────────
      const ticketMap = new Map(tickets.map((t) => [t.id, t]));
      let total = 0;
      const orderItemsData: Partial<OrderItem>[] = [];

      for (const item of items) {
        const ticket = ticketMap.get(item.ticketTypeId)!;
        const price = Number(ticket.price);
        total += price * item.quantity;

        orderItemsData.push({
          ticketTypeId: item.ticketTypeId,
          quantity: item.quantity,
          unitPrice: price,
        });
      }

      const ttl = this.config.get<number>('ORDER_TTL_MINUTES', 15);

      const savedOrder = await orderRepo.save(
        orderRepo.create({
          userId,
          status: OrderStatus.PENDING,
          currency: 'USD',
          totalAmount: total,
          expiresAt: new Date(Date.now() + ttl * 60 * 1000),
        }),
      );

      const savedItems = await orderItemRepo.save(
        orderItemRepo.create(
          orderItemsData.map((i) => ({ ...i, orderId: savedOrder.id })),
        ),
      );

      // ── Step 5: Update reservation status ─────────────────────────────────
      reservation.status = ReservationStatus.COMPLETED;
      await reservationRepo.save(reservation);

      // ── Step 6: Update ticket quantities ──────────────────────────────────
      const ticketsToUpdate: TicketType[] = [];

      for (const item of items) {
        const ticket = ticketMap.get(item.ticketTypeId)!;
        ticket.reservedQuantity -= item.quantity;
        ticket.soldQuantity += item.quantity;
        if (ticket.reservedQuantity < 0) ticket.reservedQuantity = 0;
        ticketsToUpdate.push(ticket);
      }

      await ticketRepo.save(ticketsToUpdate);

      savedOrder.items = savedItems;
      return new OrderResponseDto(savedOrder);
    });
  }
}
