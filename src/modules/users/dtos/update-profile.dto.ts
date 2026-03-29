import {
  IsOptional,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateProfileDto {
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
