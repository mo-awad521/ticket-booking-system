import { IsEmail, MaxLength, MinLength } from 'class-validator';
export class RegisterDto {
  @MinLength(3)
  @MaxLength(8)
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}
