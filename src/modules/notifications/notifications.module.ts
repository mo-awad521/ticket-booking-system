import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
//import { BullModule } from '@nestjs/bullmq';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { NotificationsService } from './notifications.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
//import { MailProcessor } from './mail.processor';
import path from 'path';

@Module({
  imports: [
    ConfigModule,
    // 1. إعداد الاتصال بـ Redis
    // BullModule.forRoot({
    //   connection: {
    //     host: 'localhost',
    //     port: 6379,
    //   },
    // }),
    // 2. تعريف الـ Queue الخاص بالإيميلات
    // BullModule.registerQueue({
    //   name: 'mail_queue',
    // }),
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('EMAIL_HOST'),
          secure: true,
          auth: {
            user: config.get('EMAIL_USER'),
            pass: config.get('EMAIL_PASS'),
          },
        },
        defaults: {
          from: `"Booking System" <${config.get('EMAIL_USER')}>`,
        },
        template: {
          // بما أن ملف email.module.ts موجود في مجلد email
          // فإن __dirname ستشير إلى dist/email، ونحن نريد مجلد templates الذي بداخله
          dir: path.join(__dirname, 'templates'),

          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [NotificationsService, EmailService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
