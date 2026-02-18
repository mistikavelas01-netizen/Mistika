import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getMercadoPagoPayment } from "@/lib/mercadopago/get-payment";
import { orderDraftsRepo } from "@/firebase/repos";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/client";
import { createOrderFromDraft } from "@/lib/order/create-order-from-draft";

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

/**
 * Valida la firma x-signature del webhook (según documentación MP).
 * Solo aplica cuando MERCADOPAGO_WEBHOOK_SECRET está configurado.
 */
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
 * Mapeo de estados de Mercado Pago a nuestro PaymentStatus
 */
const MP_STATUS_TO_PAYMENT_STATUS: Record<string, "paid" | "pending" | "failed" | "refunded"> = {
  approved: "paid",
  pending: "pending",
  in_process: "pending",
  in_mediation: "pending",
  in_collection: "pending",
  rejected: "failed",
  cancelled: "failed",
  refunded: "refunded",
  charged_back: "refunded",
};

/**
 * POST /api/webhooks/mercadopago
 *
 * Mercado Pago envía notificaciones con:
 * - topic: payment | merchant_order
 * - id: payment_id o merchant_order_id (depende del topic)
 *
 * Para topic=payment, consultamos GET /v1/payments/{id} para obtener el pago completo.
 * Aplicamos idempotencia: si mp_payment_id ya fue procesado para esa orden, no duplicamos.
 */
export async function POST(request: NextRequest) {
  const WEBHOOK_LOG_PREFIX = "[MP Webhook]";

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
        console.warn(`${WEBHOOK_LOG_PREFIX} WEBHOOK_SECRET set but x-signature missing (notification_url flow?)`);
      }
    }

    console.log(`${WEBHOOK_LOG_PREFIX} Received topic=${topic} id=${resourceId} raw=${rawBody.substring(0, 500)}`);

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

      const draftId = mpPayment?.external_reference;
      const status = mpPayment?.status ?? "";

      if (!draftId) {
        console.warn(`${WEBHOOK_LOG_PREFIX} Payment ${paymentId} has no external_reference`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const draft = await orderDraftsRepo.getById(draftId);
      if (!draft) {
        console.warn(`${WEBHOOK_LOG_PREFIX} Draft not found: ${draftId}`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const paymentStatus = MP_STATUS_TO_PAYMENT_STATUS[status] ?? "pending";

      if (paymentStatus === "paid") {
        if (draft.status === "converted") {
          console.log(`${WEBHOOK_LOG_PREFIX} Idempotency: draft ${draftId} already converted`);
          return NextResponse.json({ received: true }, { status: 200 });
        }
        const mpPreferenceId = mpPayment?.metadata?.preference_id ?? undefined;
        const created = await createOrderFromDraft(draft, paymentId, mpPreferenceId);
        if (created) {
          console.log(`${WEBHOOK_LOG_PREFIX} Created order ${created.orderId} (${created.orderNumber}) from draft ${draftId}`);
        } else {
          console.error(`${WEBHOOK_LOG_PREFIX} Failed to create order from draft ${draftId}`);
        }
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
