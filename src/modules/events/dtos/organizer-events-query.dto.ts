import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from '../entities/event.entity';

export class OrganizerEventsQueryDto {
  @IsOptional()
  @IsEnum(EventStatus, {
    message: `status must be one of: ${Object.values(EventStatus).join(', ')}`,
  })
  status?: EventStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
