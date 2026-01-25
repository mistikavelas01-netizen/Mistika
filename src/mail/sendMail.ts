/**
 * Resend mail sender
 * Uses Resend API via SDK
 */

import type {
  MailType,
  MailPayload,
  SendMailParams,
  SendMailResult,
  WelcomePayload,
  VerifyEmailPayload,
  ResetPasswordPayload,
  GenericPayload,
  OrderConfirmationPayload,
  OrderStatusPayload,
} from "./types";

import { renderTemplate } from "./templates/renderTemplate";
import { Resend } from "resend";

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get template name from mail type
 */
function getTemplateName(type: MailType): string {
  return type;
}

/**
 * Validate required environment variables
 */
function validateEnv(): { ok: boolean; error?: string } {
  if (!process.env.RESEND_KEY) {
    return { ok: false, error: "RESEND_KEY is not set" };
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    return { ok: false, error: "RESEND_FROM_EMAIL is not set" };
  }

  if (!isValidEmail(process.env.RESEND_FROM_EMAIL)) {
    return { ok: false, error: "RESEND_FROM_EMAIL is not a valid email" };
  }

  return { ok: true };
}

/**
 * Get email subject based on type and payload
 */
function getSubject(type: MailType, payload: MailPayload): string {
  switch (type) {
    case "welcome":
      return "¡Bienvenido a Mistika!";
    case "verify-email":
      return "Verifica tu correo electrónico";
    case "reset-password":
      return "Restablece tu contraseña";
    case "order-confirmation":
      return `Confirmación de pedido #${(payload as OrderConfirmationPayload).orderNumber}`;
    case "order-status": {
      const statusPayload = payload as OrderStatusPayload;
      const statusText = {
        processing: "Tu pedido está siendo preparado",
        shipped: "Tu pedido ha sido enviado",
        delivered: "Tu pedido ha sido entregado",
      };
      return `${statusText[statusPayload.status]} - #${statusPayload.orderNumber}`;
    }
    case "generic":
      return (payload as GenericPayload).subject;
    default:
      return "Notificación de Mistika";
  }
}

/**
 * Send email via Resend API
 */
export async function sendMail({
  type,
  to,
  payload,
}: SendMailParams): Promise<SendMailResult> {
  try {
    const envCheck = validateEnv();
    if (!envCheck.ok) {
      console.error("[Mail] Environment validation failed:", envCheck.error);
      return { ok: false, error: envCheck.error };
    }

    // Validate email
    if (!isValidEmail(to)) {
      console.error("[Mail] Invalid recipient email:", to);
      return { ok: false, error: "Invalid recipient email address" };
    }

    const templateName = getTemplateName(type);
    const { html, txt } = await renderTemplate(templateName, payload);

    const subject = getSubject(type, payload);

    const fromEmail = process.env.RESEND_FROM_EMAIL!;
    const fromName = process.env.RESEND_FROM_NAME || "Mistika";
    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    const resend = new Resend(process.env.RESEND_KEY!);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: txt,
    });

    if (error) {
      console.error("[Mail] Resend API error:", error);
      return {
        ok: false,
        error: error.message || "Resend API error",
      };
    }

    const messageId = data?.id;

    console.log("[Mail] Email sent successfully:", {
      type,
      to,
      messageId,
    });

    return {
      ok: true,
      messageId,
    };
  } catch (error) {
    console.error("[Mail] Unexpected error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
