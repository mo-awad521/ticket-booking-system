import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  location: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
