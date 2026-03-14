import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TicketSignatureService {
  private readonly secret: string;

  constructor(private readonly config: ConfigService) {
    this.secret = this.config.getOrThrow<string>('TICKET_QR_SECRET');
  }

  generate(ticketCode: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(ticketCode)
      .digest('hex');
  }

  buildPayload(ticketCode: string): string {
    return `${ticketCode}.${this.generate(ticketCode)}`;
  }

  verify(ticketCode: string, signature: string): boolean {
    const expected = this.generate(ticketCode);

    if (expected.length !== signature.length) return false;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }
}
