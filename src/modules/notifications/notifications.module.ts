import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_QUEUE } from './constants/email-jobs.constants';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { EmailProcessor } from './processors/email.processor';

@Module({
  imports: [ConfigModule, BullModule.registerQueue({ name: EMAIL_QUEUE })],
  providers: [
    EmailService,
    EmailTemplateService,
    NotificationQueueService,
    EmailProcessor,
  ],
  exports: [NotificationQueueService],
})
export class NotificationsModule {}
