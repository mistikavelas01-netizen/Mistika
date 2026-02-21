import { NextRequest, NextResponse } from "next/server";
import { verifyMercadoPagoWebhookSignature } from "@/lib/webhooks/verifySignature";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/client";
import { MercadoPagoService } from "@/services/MercadoPagoService";
import { BillingService } from "@/services/BillingService";
import { webhookEventsRepo, paymentsRepo } from "@/firebase/repos";
import { mapMpPaymentToPaymentDocument } from "@/lib/mercadopago/map-mp-payment-to-doc";
import { processPaymentResult, type MpPaymentLike } from "@/lib/mercadopago/process-payment-result";

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
const MAX_BODY_SIZE = 512 * 1024; // 512 KB
const RAW_PAYLOAD_MAX_LEN = 16 * 1024; // 16 KB for audit
const LOG_PREFIX = "[MP Webhook]";

type WebhookPayload = {
  id?: string | number;
  type?: string;
  topic?: string;
  action?: string;
  data?: { id?: string };
  date_created?: string;
  [k: string]: unknown;
};

function parsePayload(rawBody: string, contentType: string): WebhookPayload {
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawBody);
    const type = params.get("type") ?? "";
    const dataRaw = params.get("data");
    let dataObj: { id?: string } = {};
    if (typeof dataRaw === "string") {
      try {
        dataObj = JSON.parse(dataRaw) as { id?: string };
      } catch {
        dataObj = {};
      }
    }
    return { id: params.get("id") ?? "", type, topic: type, action: type ? `${type}.created` : "", data: dataObj };
  }
  try {
    return JSON.parse(rawBody || "{}") as WebhookPayload;
  } catch {
    return {};
  }
}

function getTopicAndAction(payload: WebhookPayload): { topic: string; action: string; resourceId: string } {
  const topic = (payload?.topic ?? payload?.type ?? "").toString().trim();
  const action = (payload?.action ?? (topic ? `${topic}.updated` : "")).toString().trim();
  const resourceId = String(payload?.data?.id ?? payload?.id ?? "").trim();
  return { topic, action, resourceId };
}

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.log(`${LOG_PREFIX} [${requestId}] POST received`);

  try {
    if (!isMercadoPagoConfigured()) {
      console.log(`${LOG_PREFIX} [${requestId}] MP not configured, skipping`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    const rawBody = await request.text();
    console.log(`${LOG_PREFIX} [${requestId}] body length=${rawBody.length} contentType=${contentType}`);

    if (rawBody.length > MAX_BODY_SIZE) {
      console.warn(`${LOG_PREFIX} [${requestId}] Payload too large (${rawBody.length})`);
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const payload = parsePayload(rawBody, contentType);
    const { topic, action, resourceId } = getTopicAndAction(payload);
    const dataIdForSignature = resourceId ? resourceId.toLowerCase() : "";
    console.log(`${LOG_PREFIX} [${requestId}] parsed topic=${topic} action=${action} resourceId=${resourceId}`);

    // Verificación de firma (cabecera x-signature). MP envía el payload en el body; la firma viene en headers.
    // Si hay secret y la firma falta o es inválida, guardamos el evento pero no procesamos (no llamamos a MP ni actualizamos pagos).
    let signatureValid = true;
    if (WEBHOOK_SECRET && resourceId) {
      const xSignature = request.headers.get("x-signature");
      const xRequestId = request.headers.get("x-request-id");
      const hasSignature = !!xSignature;
      const valid = hasSignature && verifyMercadoPagoWebhookSignature(xSignature, xRequestId, dataIdForSignature, WEBHOOK_SECRET);
      if (!valid) {
        signatureValid = false;
        console.log(`${LOG_PREFIX} [${requestId}] signature check: hasSignature=${hasSignature} valid=false -> will save event but skip processing`);
      }
    } else {
      console.log(`${LOG_PREFIX} [${requestId}] no secret or no resourceId, skipping signature check`);
    }

    const eventId = payload?.id != null ? String(payload.id) : `${topic}_${resourceId}_${action}_${Date.now()}`;
    console.log(`${LOG_PREFIX} [${requestId}] eventId=${eventId}`);
    const actionCreatedAtBucket = payload?.date_created
      ? new Date(payload.date_created).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16);

    const rawTruncated =
      rawBody.length > RAW_PAYLOAD_MAX_LEN ? rawBody.slice(0, RAW_PAYLOAD_MAX_LEN) + "\n...[truncated]" : rawBody;

    const existingByEventId = await webhookEventsRepo.where(
      "eventId" as keyof import("@/firebase/repos").WebhookEventEntity,
      "==",
      eventId
    );
    const duplicate = existingByEventId.find((e) => e.provider === "mercadopago");
    if (duplicate) {
      console.log(`${LOG_PREFIX} [${requestId}] duplicate eventId=${eventId}, skipping`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    console.log(`${LOG_PREFIX} [${requestId}] creating webhook event in DB...`);
    const created = await webhookEventsRepo.create({
      provider: "mercadopago",
      eventId,
      topic,
      action,
      resourceId,
      actionCreatedAtBucket,
      status: "received",
      retryCount: 0,
      rawPayloadTruncated: rawTruncated,
    } as import("@/firebase/repos").WebhookEventEntity);
    const webhookEvent = created as import("@/firebase/repos").WebhookEventEntity & { _id: string };
    console.log(`${LOG_PREFIX} [${requestId}] webhook event saved id=${webhookEvent._id}`);

    if (!signatureValid) {
      await webhookEventsRepo.update(webhookEvent._id!, {
        lastError: "Firma ausente o inválida (solo auditoría, no procesado)",
      });
      console.log(`${LOG_PREFIX} [${requestId}] event saved without processing (signature missing/invalid)`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    try {
      if (topic === "payment" || topic === "payments") {
        console.log(`${LOG_PREFIX} [${requestId}] processing payment resourceId=${resourceId}`);
        const mpPayment = await MercadoPagoService.getPaymentById(resourceId);
        if (!mpPayment) {
          console.warn(`${LOG_PREFIX} [${requestId}] payment not found in MP resourceId=${resourceId}`);
          await webhookEventsRepo.update(webhookEvent._id!, {
            status: "failed",
            lastError: "Payment not found in MP",
            retryCount: 1,
          });
          return NextResponse.json({ received: true }, { status: 200 });
        }
        const doc = mapMpPaymentToPaymentDocument(
          mpPayment as unknown as Parameters<typeof mapMpPaymentToPaymentDocument>[0]
        );
        const existingPayments = await paymentsRepo.where(
          "mpPaymentId" as keyof import("@/firebase/repos").PaymentEntity,
          "==",
          doc.mpPaymentId
        );
        let payment: import("@/firebase/repos").PaymentEntity & { _id: string };
        if (existingPayments.length > 0) {
          await paymentsRepo.update(existingPayments[0]._id!, { ...doc, lastSyncedAt: Date.now() });
          payment = { ...existingPayments[0], ...doc, _id: existingPayments[0]._id! };
        } else {
          const createdPayment = await paymentsRepo.create(doc as import("@/firebase/repos").PaymentEntity);
          payment = createdPayment as import("@/firebase/repos").PaymentEntity & { _id: string };
        }
        await BillingService.routeByPaymentStatus(payment);
        await processPaymentResult(mpPayment as unknown as MpPaymentLike, { auditLogPrefix: LOG_PREFIX });
      } else if (topic === "topic_chargebacks_wh") {
        console.log(`${LOG_PREFIX} [${requestId}] processing chargeback resourceId=${resourceId}`);
        const chargeback = await MercadoPagoService.getChargebackById(resourceId);
        if (chargeback?.payments && Array.isArray(chargeback.payments)) {
          for (const paymentId of chargeback.payments as number[]) {
            const pid = String(paymentId);
            const byMpId = await paymentsRepo.where(
              "mpPaymentId" as keyof import("@/firebase/repos").PaymentEntity,
              "==",
              pid
            );
            if (byMpId.length > 0) {
              await paymentsRepo.update(byMpId[0]._id!, {
                status: "charged_back",
                accessActive: false,
                riskFlagged: true,
                lastSyncedAt: Date.now(),
              });
              await BillingService.handleRefundOrChargeback({
                ...byMpId[0],
                status: "charged_back",
                accessActive: false,
                riskFlagged: true,
              });
            }
          }
        }
      } else if (topic === "topic_claims_integration_wh") {
        console.log(`${LOG_PREFIX} [${requestId}] processing claim resourceId=${resourceId}`);
        await MercadoPagoService.getClaimById(resourceId);
      } else {
        console.log(`${LOG_PREFIX} [${requestId}] topic=${topic} no handler, marking processed`);
      }

      await webhookEventsRepo.update(webhookEvent._id!, { status: "processed", processedAt: Date.now() });
      console.log(`${LOG_PREFIX} [${requestId}] done, status=processed`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${LOG_PREFIX} [${requestId}] process error:`, err);
      await webhookEventsRepo.update(webhookEvent._id!, {
        status: "failed",
        lastError: message.slice(0, 500),
        retryCount: 1,
      });
      console.log(`${LOG_PREFIX} [${requestId}] event updated to failed`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] top-level error (no event saved):`, error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
