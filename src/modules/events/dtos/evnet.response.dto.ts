import { Event } from '../entities/event.entity';

export class EventResponseDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  location: string;
  imageUrl?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(event: Event) {
    this.id = event.id;
    this.title = event.title;
    this.slug = event.slug;
    this.description = event.description;
    this.location = event.location;
    this.imageUrl = event.imageUrl ?? undefined;
    this.startDate = event.startDate;
    this.endDate = event.endDate;
    this.status = event.status;
    this.publishedAt = event.publishedAt ?? null;
    this.createdAt = event.createdAt;
    this.updatedAt = event.updatedAt;
  }
}
