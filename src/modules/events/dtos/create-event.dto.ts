import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'NestJS Conference 2026', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({
    example: 'A one-day conference about NestJS best practices.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Amman, Jordan', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  location: string;

  @ApiPropertyOptional({
    description: 'Only used if no file is uploaded via multipart/form-data',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  endDate: string;
}
