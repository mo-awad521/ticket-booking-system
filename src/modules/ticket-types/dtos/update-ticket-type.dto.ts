import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTicketTypeDto {
  @ApiPropertyOptional({ example: 'VIP - Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 59.99,
    minimum: 0,
    description: 'Cannot be changed once tickets have been sold or reserved',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: 150,
    minimum: 1,
    description: 'Cannot be set below the already sold + reserved amount',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  saleStart?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  saleEnd?: string;
}
