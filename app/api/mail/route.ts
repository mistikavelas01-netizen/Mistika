import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/mail/sendMail";
import { z } from "zod";
import { withDependency } from "../_utils/dependencies";
import { logger } from "../_utils/logger";
import { withApiRoute } from "../_utils/with-api-route";

/**
 * Validation schemas for each mail type
 */
const welcomeSchema = z.object({
  type: z.literal("welcome"),
  to: z.string().email(),
  payload: z.object({
    name: z.string().min(1),
  }),
});

const verifyEmailSchema = z.object({
  type: z.literal("verify-email"),
  to: z.string().email(),
  payload: z.object({
    name: z.string().min(1),
    verifyUrl: z.string().url(),
  }),
});

const resetPasswordSchema = z.object({
  type: z.literal("reset-password"),
  to: z.string().email(),
  payload: z.object({
    name: z.string().min(1),
    resetUrl: z.string().url(),
  }),
});

const genericSchema = z.object({
  type: z.literal("generic"),
  to: z.string().email(),
  payload: z.object({
    subject: z.string().min(1),
    message: z.string().min(1),
  }),
});

const orderConfirmationSchema = z.object({
  type: z.literal("order-confirmation"),
  to: z.string().email(),
  payload: z.object({
    name: z.string().min(1),
    orderNumber: z.string().min(1),
    orderDate: z.string().min(1),
    totalAmount: z.number().min(0),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().min(0),
      })
    ),
    shippingAddress: z.string().min(1),
    orderUrl: z.string().url().optional(),
  }),
});

const mailRequestSchema = z.discriminatedUnion("type", [
  welcomeSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  genericSchema,
  orderConfirmationSchema,
]);

/**
 * POST /api/mail
 * Send transactional email via Resend
 */
export const POST = withApiRoute({ route: "/api/mail" }, async (request: NextRequest) => {
  try {
    // Parse and validate request body
    const body = await request.json();

    const validationResult = mailRequestSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn("mail.validation_failed", {
        issuesCount: validationResult.error.issues.length,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Solicitud inválida",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { type, to, payload } = validationResult.data;

    // Send email
    const result = await withDependency(
      { name: "resend", operation: `sendMail:${type}` },
      () => sendMail({ type, to, payload })
    );

    if (!result.ok) {
      logger.error("mail.send_failed", { error: result.error });
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "No se pudo enviar el correo",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
    });
  } catch (error) {
    logger.error("mail.unexpected_error", { error });

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          ok: false,
          error: "JSON inválido en el cuerpo de la solicitud",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/mail
 * Health check endpoint
 */
export const GET = withApiRoute({ route: "/api/mail" }, async () => {
  return NextResponse.json({
    service: "Mail API",
    status: "operational",
    supportedTypes: ["welcome", "verify-email", "reset-password", "generic", "order-confirmation"],
  });
});
