import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketStatus } from '../../tickets/enums/ticket-status.enum';
import { EventStatsDto } from '../dtos/event-stats.dto';

@Injectable()
export class EventAnalyticsService {
  private readonly logger = new Logger(EventAnalyticsService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async getEventStats(eventId: string): Promise<EventStatsDto> {
    const result = await this.ticketRepo
      .createQueryBuilder('t')
      .select('COUNT(*)', 'sold')
      .addSelect(
        `SUM(CASE WHEN t.status = '${TicketStatus.USED}' THEN 1 ELSE 0 END)`,
        'checkedIn',
      )
      .where('t.event_id = :eventId', { eventId })
      .getRawOne<{ sold: string; checkedIn: string }>();

    const totalSold = Number(result?.sold ?? 0);
    const checkedIn = Number(result?.checkedIn ?? 0);

    return {
      eventId,
      totalSold,
      checkedIn,
      pendingCheckIn: totalSold - checkedIn,
      checkInRate:
        totalSold > 0 ? Math.round((checkedIn / totalSold) * 100) : 0,
      lastUpdatedAt: new Date(),
    };
  }
}
