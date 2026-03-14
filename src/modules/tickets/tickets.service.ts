import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Order } from '../orders/entities/order.entity';
import { Ticket } from './entities/ticket.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { TicketResponseDto } from './dtos/ticket-response.dto';
import { QrCodeService } from './services/qr-code.service';

export class GetMyTicketsQueryDto {
  page?: number = 1;
  limit?: number = 20;
}

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,

    private readonly qrCodeService: QrCodeService,
  ) {}

  async generateTicketsFromOrder(
    orderId: string,
  ): Promise<TicketResponseDto[]> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.ticketType'],
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Cannot generate tickets for unpaid order');
    }

    // ── Idempotency Guard ─────────────────────────────────
    const existingCount = await this.ticketRepo.count({ where: { orderId } });
    if (existingCount > 0) {
      this.logger.warn(
        `Tickets already exist for order ${orderId} — returning existing`,
      );
      const existing = await this.ticketRepo.find({ where: { orderId } });
      return existing.map((t) => new TicketResponseDto(t));
    }

    const ticketData: Array<{
      ticketTypeId: string;
      eventId: string;
      code: string;
      qrCodeUrl: string;
    }> = [];

    for (const item of order.items) {
      // ✅ Fail Fast — لا نُكمل لو eventId غير متاح
      if (!item.ticketType?.eventId) {
        throw new InternalServerErrorException(
          `Cannot resolve eventId for order item ${item.id}`,
        );
      }

      const eventId = item.ticketType.eventId;

      for (let i = 0; i < item.quantity; i++) {
        const code = randomUUID();
        const qrUrl = await this.qrCodeService.generateQr(code);
        ticketData.push({
          ticketTypeId: item.ticketTypeId,
          eventId,
          code,
          qrCodeUrl: qrUrl,
        });
      }
    }

    // ── Bulk Insert ───────────────────────────────────────
    const tickets = ticketData.map((data) =>
      this.ticketRepo.create({
        orderId: order.id,
        ticketTypeId: data.ticketTypeId,
        eventId: data.eventId,
        code: data.code,
        qrCodeUrl: data.qrCodeUrl,
      }),
    );

    const saved = await this.ticketRepo.save(tickets);
    this.logger.log(`Generated ${saved.length} tickets for order ${orderId}`);

    return saved.map((t) => new TicketResponseDto(t));
  }

  async getUserTickets(
    userId: string,
    query: GetMyTicketsQueryDto = {},
  ): Promise<{ data: TicketResponseDto[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const [tickets, total] = await this.ticketRepo
      .createQueryBuilder('ticket')

      // ── Joins ──────────────────────────────────────────
      .innerJoin('ticket.order', 'order')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('ticketType.event', 'event')

      // ── Filter ─────────────────────────────────────────
      .where('order.userId = :userId', { userId })

      .select([
        'ticket.id',
        'ticket.code',
        'ticket.qrCodeUrl',
        'ticket.status',
        'ticket.orderId',
        'ticket.usedAt',
        'ticket.createdAt',
        'ticketType.id',
        'ticketType.name',
        'ticketType.price',
        'event.id',
        'event.title',
        'event.startDate',
        'event.endDate',
        'event.location',
        'event.imageUrl',
      ])

      .orderBy('ticket.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: tickets.map((t) => new TicketResponseDto(t)),
      total,
    };
  }
}
