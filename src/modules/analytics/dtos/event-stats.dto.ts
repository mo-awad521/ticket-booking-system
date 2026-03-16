export class EventStatsDto {
  eventId: string;
  totalSold: number;
  checkedIn: number;
  pendingCheckIn: number;
  checkInRate: number;
  lastUpdatedAt: Date;
}
