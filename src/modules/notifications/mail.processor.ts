import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './email.service';
import { Logger } from '@nestjs/common';

@Processor('mail_queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);

    switch (job.name) {
      case 'send-verification-email': {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { email, name, token } = job.data;
        return await this.emailService.sendVerificationEmail(
          email,
          name,
          token,
        );
      }

      // يمكنك إضافة حالات أخرى هنا مثل 'reset-password'
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
