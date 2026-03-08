import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(email: string, name: string, token: string) {
    const url = `${process.env.EMAIL_VERIFICATION_URL}?token=${token}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Ticket Booking App! Verify your email',
        template: 'verification',
        context: {
          name,
          url,
        },
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error sending email to ${email}`, error.stack);
      throw new InternalServerErrorException('Could not send email');
    }
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    // استخدام متغير بيئة مخصص لرابط استعادة كلمة المرور
    const url = `${process.env.PASSWORD_RESET_URL}?token=${token}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your password - Ticket Booking App',
        template: 'password-reset', // تأكد أن اسم ملف القالب (hbs) هو password-reset
        context: {
          name,
          url,
        },
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const errorMessage =
        error instanceof Error ? error.stack : 'Unknown error';
      this.logger.error(
        `Error sending password reset email to ${email}`,
        errorMessage,
      );

      throw new InternalServerErrorException(
        'Could not send password reset email',
      );
    }
  }
}
