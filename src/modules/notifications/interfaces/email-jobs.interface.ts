export interface VerificationEmailPayload {
  to: string;
  name: string;
  token: string;
}

export interface PasswordResetPayload {
  to: string;
  name: string;
  token: string;
}

export interface OrderConfirmationPayload {
  to: string;
  name: string;
  orderId: string;
  totalAmount: number;
  currency: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
}

export interface TicketGeneratedPayload {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketCount: number;
}

export interface EventCancelledPayload {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  reason: string;
}

export type EmailPayload =
  | VerificationEmailPayload
  | PasswordResetPayload
  | OrderConfirmationPayload
  | TicketGeneratedPayload
  | EventCancelledPayload;
