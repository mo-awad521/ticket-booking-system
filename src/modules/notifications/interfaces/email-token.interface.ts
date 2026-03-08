export interface EmailTokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
