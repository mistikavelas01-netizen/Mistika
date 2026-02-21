import { NextRequest, NextResponse } from "next/server";
import { verifyMercadoPagoWebhookSignature } from "@/lib/webhooks/verifySignature";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/client";
import {
  getPaymentById as getMpPaymentById,
  getChargebackById,
  getClaimById,
} from "@/services/MercadoPagoService";
import {
  routeByPaymentStatus,
  handleRefundOrChargeback,
} from "@/services/BillingService";
import { webhookEventsRepo, paymentsRepo } from "../../_utils/repos";
import { mapMpPaymentToPaymentDocument } from "@/lib/mercadopago/map-mp-payment-to-doc";
import { processPaymentResult, type MpPaymentLike } from "@/lib/mercadopago/process-payment-result";
import { withDependency } from "../../_utils/dependencies";
import { logger } from "../../_utils/logger";
import { withApiRoute } from "../../_utils/with-api-route";

/** Clave secreta de Webhooks (Tus integraciones > Webhooks). Verifica autenticidad con x-signature. */
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
const MAX_BODY_SIZE = 512 * 1024; // 512 KB
const RAW_PAYLOAD_MAX_LEN = 16 * 1024; // 16 KB for audit

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

export const POST = withApiRoute({ route: "/api/webhooks/mercadopago" }, async (request: NextRequest) => {
  logger.info("mp.webhook.received");

  try {
    if (!isMercadoPagoConfigured()) {
      logger.warn("mp.webhook.not_configured");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    const rawBody = await request.text();
    logger.info("mp.webhook.body_received", { bodySize: rawBody.length, contentType });

    if (rawBody.length > MAX_BODY_SIZE) {
      logger.warn("mp.webhook.payload_too_large", { bodySize: rawBody.length });
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const payload = parsePayload(rawBody, contentType);
    const { topic, action, resourceId } = getTopicAndAction(payload);
    const dataIdFromQuery = request.nextUrl.searchParams.get("data.id");
    const dataIdForSignature = (dataIdFromQuery ?? resourceId).toString().trim();
    const dataIdNormalized = dataIdForSignature ? dataIdForSignature.toLowerCase() : "";

    logger.info("mp.webhook.parsed", { topic, action, resourceId, hasDataId: Boolean(dataIdNormalized) });

    let signatureValid = true;
    if (WEBHOOK_SECRET && dataIdNormalized) {
      const xSignature = request.headers.get("x-signature");
      const xRequestId = request.headers.get("x-request-id");
      const hasSignature = !!xSignature;
      const valid =
        hasSignature &&
        verifyMercadoPagoWebhookSignature(xSignature, xRequestId, dataIdNormalized, WEBHOOK_SECRET, {
          skipTimestampTolerance: process.env.NODE_ENV !== "production",
        });
      if (!valid) {
        signatureValid = false;
        logger.warn("mp.webhook.signature_invalid", { hasSignature });
      }
    } else {
      logger.info("mp.webhook.signature_skipped", {
        reason: !WEBHOOK_SECRET ? "missing_secret" : "missing_data_id",
      });
    }

    const eventId = payload?.id != null ? String(payload.id) : `${topic}_${resourceId}_${action}_${Date.now()}`;
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
      logger.info("mp.webhook.duplicate_event", { eventId });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    logger.info("mp.webhook.persisting_event", { eventId, topic, action });
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
    logger.info("mp.webhook.event_saved", { eventId, webhookEventId: webhookEvent._id });

    if (!signatureValid) {
      await webhookEventsRepo.update(webhookEvent._id!, {
        lastError: "Firma ausente o inválida (solo auditoría, no procesado)",
      });
      logger.warn("mp.webhook.saved_unverified", { eventId });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    try {
      if (topic === "payment" || topic === "payments") {
        logger.info("mp.webhook.process_payment", { resourceId });
        const mpPayment = await withDependency(
          { name: "mercadopago", operation: "payment.get" },
          () => getMpPaymentById(resourceId)
        );
        if (!mpPayment) {
          logger.warn("mp.webhook.payment_not_found", { resourceId });
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
        await routeByPaymentStatus(payment);
        await withDependency(
          { name: "app", operation: "processPaymentResult" },
          () => processPaymentResult(mpPayment as unknown as MpPaymentLike, { auditLogPrefix: "[MP Webhook]" })
        );
      } else if (topic === "topic_chargebacks_wh") {
        logger.info("mp.webhook.process_chargeback", { resourceId });
        const chargeback = await withDependency(
          { name: "mercadopago", operation: "chargeback.get" },
          () => getChargebackById(resourceId)
        );
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
              await handleRefundOrChargeback({
                ...byMpId[0],
                status: "charged_back",
                accessActive: false,
                riskFlagged: true,
              });
            }
          }
        }
      } else if (topic === "topic_claims_integration_wh") {
        logger.info("mp.webhook.process_claim", { resourceId });
        await withDependency(
          { name: "mercadopago", operation: "claim.get" },
          () => getClaimById(resourceId)
        );
      } else {
        logger.info("mp.webhook.no_handler", { topic, action });
      }

      await webhookEventsRepo.update(webhookEvent._id!, { status: "processed", processedAt: Date.now() });
      logger.info("mp.webhook.processed", { eventId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("mp.webhook.process_failed", { error: err, eventId, topic });
      await webhookEventsRepo.update(webhookEvent._id!, {
        status: "failed",
        lastError: message.slice(0, 500),
        retryCount: 1,
      });
      logger.warn("mp.webhook.marked_failed", { eventId });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error("mp.webhook.unhandled_error", { error });
    return NextResponse.json({ received: true }, { status: 200 });
  }
});

export const GET = withApiRoute({ route: "/api/webhooks/mercadopago" }, async () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
});
