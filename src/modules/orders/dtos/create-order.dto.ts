import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description:
      'An active (non-expired, non-used) reservation UUID owned by the current user',
  })
  @IsUUID()
  reservationId: string;
}
