import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

const MIN_QR_LENGTH = 101;

export class ScanTicketDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(MIN_QR_LENGTH)
  qrData: string;

  @IsUUID('4')
  @IsNotEmpty()
  eventId: string;
}
