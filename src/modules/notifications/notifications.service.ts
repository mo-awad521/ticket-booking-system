import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendEmailVerification(email: string, token: string) {
    const activationLink = `http://localhost:3000/auth/verify-email?token=${token}`;

    const html = this.buildVerificationTemplate(activationLink);

    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Verify Your Email',
      html,
    });

    this.logger.log(`Verification email sent to ${email}`);
  }

  private buildVerificationTemplate(link: string): string {
    return `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Verify Your Email</h2>
        <p>Please click the button below to verify your account.</p>
        <a href="${link}" 
           style="background:#4CAF50;color:white;padding:10px 20px;
           text-decoration:none;border-radius:5px;">
           Verify Email
        </a>
        <p>This link will expire in 1 hour.</p>
      </div>`;
  }
}
