import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.getOrThrow<string>('MAIL_FROM');
  }

  async send(opts: SendEmailOptions): Promise<void> {
    const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];

    const { data, error } = await this.resend.emails.send({
      from: opts.from ?? this.from,
      to: recipients,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });

    if (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(
        `Resend error — subject: "${opts.subject}" to: ${recipients.join(', ')} — ${message}`,
      );
      throw new Error(message);
    }

    this.logger.log(
      `Email sent [id: ${data?.id ?? 'unknown'}] → ${recipients.join(', ')} | ${opts.subject}`,
    );
  }

  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      if (typeof err['message'] === 'string') return err['message'];
      if (typeof err['name'] === 'string') return err['name'];
    }
    return 'Unknown Resend error';
  }
}
