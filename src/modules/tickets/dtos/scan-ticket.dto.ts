import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const MIN_QR_LENGTH = 101;

export class ScanTicketDto {
  @ApiProperty({
    description: 'Raw QR payload in the form "<ticketCode>.<hmacSignature>"',
    minLength: MIN_QR_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(MIN_QR_LENGTH)
  qrData: string;

  @ApiProperty({ description: 'Event UUID the staff member is scanning for' })
  @IsUUID('4')
  @IsNotEmpty()
  eventId: string;
}
