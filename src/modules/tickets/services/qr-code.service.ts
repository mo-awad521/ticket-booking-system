import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { CloudinaryService } from 'src/modules/media/services/cloudinary.service';

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async generateQr(ticketCode: string): Promise<string> {
    let qrBase64: string;

    try {
      qrBase64 = await QRCode.toDataURL(ticketCode, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
      });
    } catch (err) {
      this.logger.error(`QR generation failed for code ${ticketCode}`, err);
      throw new InternalServerErrorException('Failed to generate QR code');
    }

    try {
      const uploaded = await this.cloudinaryService.uploadBase64Image(
        qrBase64,
        'tickets',
        `ticket-${ticketCode}`,
      );

      return uploaded.url;
    } catch (err) {
      this.logger.error(
        `Cloudinary upload failed for ticket ${ticketCode}`,
        err,
      );
      throw new InternalServerErrorException('Failed to upload QR code');
    }
  }
}
