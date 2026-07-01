export const EMAIL_QUEUE = 'email_queue' as const;

export const EmailJob = {
  VERIFICATION: 'send-verification-email',
  PASSWORD_RESET: 'send-password-reset',
  ORDER_CONFIRMATION: 'send-order-confirmation',
  TICKET_GENERATED: 'send-ticket-generated',
  EVENT_CANCELLED: 'send-event-cancelled',
  TICKET_CONFIRMATION: 'ticket.confirmation',
} as const;

export type EmailJobName = (typeof EmailJob)[keyof typeof EmailJob];
