import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE, EmailJob } from '../constants/email-jobs.constants';
import {
  VerificationEmailPayload,
  PasswordResetPayload,
  OrderConfirmationPayload,
  TicketGeneratedPayload,
  EventCancelledPayload,
} from '../interfaces/email-jobs.interface';

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
} as const;

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue,
  ) {}

  async sendVerificationEmail(
    payload: VerificationEmailPayload,
  ): Promise<void> {
    await this.enqueue(EmailJob.VERIFICATION, payload);
  }

  async sendPasswordReset(payload: PasswordResetPayload): Promise<void> {
    await this.enqueue(EmailJob.PASSWORD_RESET, payload, { priority: 1 });
  }

  async sendOrderConfirmation(
    payload: OrderConfirmationPayload,
  ): Promise<void> {
    await this.enqueue(EmailJob.ORDER_CONFIRMATION, payload);
  }

  async sendTicketGenerated(payload: TicketGeneratedPayload): Promise<void> {
    await this.enqueue(EmailJob.TICKET_GENERATED, payload);
  }

  async sendEventCancelled(payload: EventCancelledPayload): Promise<void> {
    await this.enqueue(EmailJob.EVENT_CANCELLED, payload, { priority: 1 });
  }

  private async enqueue(
    jobName: string,
    payload: unknown,
    extra?: { priority?: number; delay?: number },
  ): Promise<void> {
    try {
      const job = await this.emailQueue.add(jobName, payload, {
        ...DEFAULT_JOB_OPTIONS,
        ...extra,
      });
      this.logger.debug(`Enqueued [${jobName}] — job id: ${job.id}`);
    } catch (err) {
      this.logger.error(`Failed to enqueue [${jobName}]`, err);
      throw err;
    }
  }
}
