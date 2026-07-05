import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Event } from '../entities/event.entity';

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  location: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startDate: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  endDate: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  publishedAt?: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
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
