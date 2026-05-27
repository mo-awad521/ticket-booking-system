/**
 * Centralised cache key factory.
 * Keeps keys consistent across services and makes prefix-invalidation safe.
 */
export const CacheKey = {
  // ── Public events list ──────────────────────────────────────────────────
  eventsList: (
    page: number,
    limit: number,
    search?: string,
    location?: string,
    sort?: string,
  ) =>
    `events:public:p${page}:l${limit}:s${search ?? ''}:loc${location ?? ''}:sort${sort ?? 'ASC'}`,

  eventsListPrefix: () => 'events:public:',

  // ── Single event ────────────────────────────────────────────────────────
  eventById: (id: string) => `events:id:${id}`,

  // ── Public ticket types for an event ────────────────────────────────────
  ticketTypes: (eventId: string) => `ticket-types:public:${eventId}`,

  // ── Organizer event list ────────────────────────────────────────────────
  organizerEvents: (
    userId: string,
    page: number,
    limit: number,
    status?: string,
  ) => `events:organizer:${userId}:p${page}:l${limit}:st${status ?? ''}`,

  organizerEventsPrefix: (userId: string) => `events:organizer:${userId}:`,
} as const;

/** TTL constants in milliseconds */
export const CacheTTL = {
  PUBLIC_EVENTS: 60_000, //  60 seconds  — frequently updated
  EVENT_DETAIL: 300_000, //   5 minutes  — rarely changes once published
  TICKET_TYPES: 30_000, //  30 seconds  — changes on every reservation
  ORGANIZER_LIST: 120_000, //   2 minutes
} as const;
