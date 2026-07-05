import {
  IsOptional,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Mohammad Awad',
    minLength: 2,
    maxLength: 50,
    description: 'Letters, spaces, hyphens and apostrophes only.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[\p{L}\s'-]+$/u, {
    message: 'Name can only contain letters, spaces, hyphens and apostrophes',
  })
  name?: string;
}
