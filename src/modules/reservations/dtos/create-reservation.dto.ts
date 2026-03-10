import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReservationItemDto {
  @IsUUID()
  ticketTypeId: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;
}

export class CreateReservationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ReservationItemDto)
  items: ReservationItemDto[];
}
