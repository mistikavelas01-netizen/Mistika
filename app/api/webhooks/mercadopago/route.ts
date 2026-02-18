import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getMercadoPagoPayment } from "@/lib/mercadopago/get-payment";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/client";
import { processPaymentResult } from "@/lib/mercadopago/process-payment-result";

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
const WEBHOOK_LOG_PREFIX = "[MP Webhook]";

function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature || !secret) return true;
  const parts = xSignature.split(",");
  let ts = "";
  let hash = "";
  for (const part of parts) {
    const [key, val] = part.split("=").map((s) => s.trim());
    if (key === "ts") ts = val ?? "";
    else if (key === "v1") hash = val ?? "";
  }
  if (!ts || !hash) return false;
  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;
  const computed = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const hashBuf = Buffer.from(hash, "hex");
  const computedBuf = Buffer.from(computed, "hex");
  if (hashBuf.length !== computedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, computedBuf);
}

/**
 * POST /api/webhooks/mercadopago
 *
 * topic: payment | payments | merchant_order
 * data.id: payment_id o merchant_order_id
 *
 * Consultamos el recurso en MP (GET /v1/payments/{id}), actualizamos CheckoutOrder y PaymentAttempt
 * con idempotencia. Si status approved, creamos la orden desde el draft.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isMercadoPagoConfigured()) {
      console.warn(`${WEBHOOK_LOG_PREFIX} MERCADOPAGO_ACCESS_TOKEN not configured`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let rawBody: string;
    let payload: { id?: string; type?: string; topic?: string; data?: { id?: string } };

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      rawBody = JSON.stringify(Object.fromEntries(formData.entries()));
      const type = String(formData.get("type") ?? "");
      const dataRaw = formData.get("data");
      let dataObj: { id?: string } = {};
      if (typeof dataRaw === "string") {
        try {
          dataObj = JSON.parse(dataRaw);
        } catch {
          dataObj = {};
        }
      }
      payload = { type, topic: type, data: dataObj, id: String(formData.get("id") ?? "") };
    } else {
      rawBody = await request.text();
      try {
        payload = JSON.parse(rawBody || "{}");
      } catch {
        payload = {};
      }
    }

    const topic = payload?.topic ?? payload?.type ?? "";
    const resourceId = String(payload?.data?.id ?? payload?.id ?? "").trim();
    const dataIdForSignature = resourceId.toLowerCase();

    if (WEBHOOK_SECRET && resourceId) {
      const xSignature = request.headers.get("x-signature");
      const xRequestId = request.headers.get("x-request-id");
      if (xSignature) {
        if (!validateWebhookSignature(xSignature, xRequestId, dataIdForSignature, WEBHOOK_SECRET)) {
          console.warn(`${WEBHOOK_LOG_PREFIX} Invalid x-signature, rejecting`);
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      } else {
        console.warn(`${WEBHOOK_LOG_PREFIX} WEBHOOK_SECRET set but x-signature missing`);
      }
    }

    console.log(
      `${WEBHOOK_LOG_PREFIX} topic=${topic} resourceId=${resourceId} raw=${rawBody.substring(0, 400)}`
    );

    if (topic === "payment" || topic === "payments") {
      const paymentId = String(resourceId);
      if (!paymentId || paymentId === "undefined") {
        console.warn(`${WEBHOOK_LOG_PREFIX} No payment_id in payload`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      let mpPayment: Awaited<ReturnType<typeof getMercadoPagoPayment>>;
      try {
        mpPayment = await getMercadoPagoPayment(paymentId);
      } catch (err) {
        console.error(`${WEBHOOK_LOG_PREFIX} Failed to fetch payment ${paymentId}:`, err);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const result = await processPaymentResult(mpPayment as Parameters<typeof processPaymentResult>[0], {
        auditLogPrefix: WEBHOOK_LOG_PREFIX,
      });

      if (result.alreadyProcessed) {
        console.log(`${WEBHOOK_LOG_PREFIX} Idempotency: payment ${paymentId} already processed`);
      } else if (result.status === "APPROVED" && result.orderId) {
        console.log(
          `${WEBHOOK_LOG_PREFIX} Order ${result.orderId} (${result.orderNumber}) confirmed for payment ${paymentId}`
        );
      }
    } else if (topic === "merchant_order") {
      console.log(`${WEBHOOK_LOG_PREFIX} merchant_order not implemented, skipping`);
    } else {
      console.log(`${WEBHOOK_LOG_PREFIX} Unhandled topic: ${topic}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(`${WEBHOOK_LOG_PREFIX} Error:`, error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
