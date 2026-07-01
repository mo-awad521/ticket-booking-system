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

// TicketItem داخل كل تذكرة
export interface TicketItemPayload {
  ticketNumber: string;
  ticketType: string;
  seatInfo?: string;
  qrCodeUrl: string; // URL جاهز لـ <img src="...">
}

// الـ payload الكامل للإيميل
export interface TicketConfirmationPayload {
  to: string; // إيميل المستخدم
  userName: string;
  eventName: string;
  eventDate: string; // "الجمعة، ١٥ يناير ٢٠٢٦"
  eventTime: string; // "٨:٠٠ مساءً"
  venueName: string;
  venueAddress?: string;
  tickets: TicketItemPayload[];
  ticketCount: number;
  orderId: string;
  totalAmount: string; // "150.00"
  currency: string; // "SAR"
  currentYear: number;
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
  | EventCancelledPayload
  | TicketConfirmationPayload
  | TicketItemPayload;
