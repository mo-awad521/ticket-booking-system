import {
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketTypeDto {
  @ApiProperty({ example: 'VIP' })
  @IsString()
  name: string;

  @ApiProperty({ example: 49.99, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Must be in the future and before the event start date',
  })
  @IsOptional()
  @IsDateString()
  saleStart?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Must be after saleStart and not exceed the event end date',
  })
  @IsOptional()
  @IsDateString()
  saleEnd?: string;
}
