/**
 * Mail types and payload definitions
 */

export type MailType = "welcome" | "verify-email" | "reset-password" | "generic" | "order-confirmation" | "order-status";

export interface WelcomePayload {
  name: string;
}

export interface VerifyEmailPayload {
  name: string;
  verifyUrl: string;
}

export interface ResetPasswordPayload {
  name: string;
  resetUrl: string;
}

export interface GenericPayload {
  subject: string;
  message: string;
}

export interface OrderConfirmationPayload {
  name: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: string;
  orderUrl?: string;
}

export interface OrderStatusPayload {
  name: string;
  orderNumber: string;
  status: "processing" | "shipped" | "delivered";
  orderUrl: string;
}

export type MailPayload =
  | WelcomePayload
  | VerifyEmailPayload
  | ResetPasswordPayload
  | GenericPayload
  | OrderConfirmationPayload
  | OrderStatusPayload;

export interface SendMailParams {
  type: MailType;
  to: string;
  payload: MailPayload;
}

export interface SendMailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}
