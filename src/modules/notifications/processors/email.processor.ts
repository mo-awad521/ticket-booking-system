import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { EMAIL_QUEUE, EmailJob } from '../constants/email-jobs.constants';
import { EmailService } from '../services/email.service';
import { EmailTemplateService } from '../services/email-template.service';
import {
  VerificationEmailPayload,
  PasswordResetPayload,
  OrderConfirmationPayload,
  TicketGeneratedPayload,
  EventCancelledPayload,
  TicketConfirmationPayload,
} from '../interfaces/email-jobs.interface';

@Processor(EMAIL_QUEUE, { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly templateService: EmailTemplateService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(
      `Processing [${job.name}] — attempt ${job.attemptsMade + 1}`,
    );

    switch (job.name) {
      case EmailJob.VERIFICATION:
        return this.handleVerification(job.data as VerificationEmailPayload);
      case EmailJob.PASSWORD_RESET:
        return this.handlePasswordReset(job.data as PasswordResetPayload);
      case EmailJob.ORDER_CONFIRMATION:
        return this.handleOrderConfirmation(
          job.data as OrderConfirmationPayload,
        );
      case EmailJob.TICKET_GENERATED:
        return this.handleTicketGenerated(job.data as TicketGeneratedPayload);
      case EmailJob.EVENT_CANCELLED:
        return this.handleEventCancelled(job.data as EventCancelledPayload);
      case EmailJob.TICKET_CONFIRMATION: {
        const data = job.data as TicketConfirmationPayload;

        const html = this.templateService.render('ticket-confirmation', {
          to: data.to,
          eventName: data.eventName,
          ticketCount: data.ticketCount,
        });

        await this.emailService.send({
          to: data.to,
          subject: `🎟️ your tickets ready — ${data.eventName}`,
          html,
        });

        this.logger.log(
          `Ticket confirmation sent → ${data.to} | ${data.ticketCount} tickets`,
        );
        break;
      }
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleVerification(p: VerificationEmailPayload): Promise<void> {
    const url = `${this.config.getOrThrow('EMAIL_VERIFICATION_URL')}?token=${p.token}`;
    const html = this.templateService.render('verification', {
      name: p.name,
      url,
    });
    await this.emailService.send({
      to: p.to,
      subject: 'Verify your email — Ticket Booking',
      html,
    });
  }

  private async handlePasswordReset(p: PasswordResetPayload): Promise<void> {
    const url = `${this.config.getOrThrow('PASSWORD_RESET_URL')}?token=${p.token}`;
    const html = this.templateService.render('password-reset', {
      name: p.name,
      url,
    });
    await this.emailService.send({
      to: p.to,
      subject: 'Reset your password — Ticket Booking',
      html,
    });
  }

  private async handleOrderConfirmation(
    p: OrderConfirmationPayload,
  ): Promise<void> {
    const html = this.templateService.render('order-confirmation', {
      name: p.name,
      orderId: p.orderId,
      totalAmount: p.totalAmount.toFixed(2),
      currency: p.currency,
      items: p.items,
    });
    await this.emailService.send({
      to: p.to,
      subject: `Order confirmed #${p.orderId.slice(0, 8).toUpperCase()}`,
      html,
    });
  }

  private async handleTicketGenerated(
    p: TicketGeneratedPayload,
  ): Promise<void> {
    const html = this.templateService.render('ticket-generated', {
      name: p.name,
      eventTitle: p.eventTitle,
      eventDate: p.eventDate,
      eventLocation: p.eventLocation,
      ticketCount: p.ticketCount,
    });
    await this.emailService.send({
      to: p.to,
      subject: `Your ${p.ticketCount > 1 ? `${p.ticketCount} tickets` : 'ticket'} for ${p.eventTitle}`,
      html,
    });
  }

  private async handleEventCancelled(p: EventCancelledPayload): Promise<void> {
    const html = this.templateService.render('event-cancelled', {
      name: p.name,
      eventTitle: p.eventTitle,
      eventDate: p.eventDate,
      reason: p.reason,
    });
    await this.emailService.send({
      to: p.to,
      subject: `Important: ${p.eventTitle} has been cancelled`,
      html,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `Job [${job.name}] failed after ${job.attemptsMade} attempts — ${err.message}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job [${job.name}] completed — id: ${job.id}`);
  }
}
