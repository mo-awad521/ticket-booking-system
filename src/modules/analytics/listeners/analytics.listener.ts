import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  TICKET_CHECKED_IN_EVENT,
  TicketCheckedInEvent,
} from '../../tickets/events/ticket-checked-in.event';
import { EventAnalyticsService } from '../services/event-analytics.service';
import { EventAnalyticsGateway } from '../gateways/event-analytics.gateway';
import { EventStatsDto } from '../dtos/event-stats.dto';

@Injectable()
export class AnalyticsListener {
  private readonly logger = new Logger(AnalyticsListener.name);

  constructor(
    private readonly analyticsService: EventAnalyticsService,
    private readonly gateway: EventAnalyticsGateway,
  ) {}

  @OnEvent(TICKET_CHECKED_IN_EVENT, { async: true })
  handleTicketCheckedIn(rawPayload: unknown): void {
    const payload = rawPayload as TicketCheckedInEvent;

    // ✅ .then().catch() يتجنب نمط let+try/catch الذي يُربك ESLint
    // TypeScript يستنتج نوع stats تلقائياً من return type الـ getEventStats
    // void: نُخبر ESLint صراحةً أننا لا نهتم بالـ Promise هنا
    void this.analyticsService
      .getEventStats(payload.eventId)
      .then((stats: EventStatsDto) => {
        this.gateway.emitCheckIn(payload.eventId, stats);
        this.logger.debug(
          `Analytics emitted for event ${payload.eventId} — ` +
            `checkedIn: ${stats.checkedIn}/${stats.totalSold}`,
        );
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to emit analytics for event ${payload.eventId}: ${message}`,
        );
      });
  }
}
