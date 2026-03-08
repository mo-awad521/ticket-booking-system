import {
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketTypeDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsDateString()
  saleStart?: string;

  @IsOptional()
  @IsDateString()
  saleEnd?: string;
}
