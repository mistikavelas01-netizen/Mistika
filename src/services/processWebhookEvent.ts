import "server-only";
import { webhookEventsRepo, paymentsRepo } from "@/firebase/repos";
import { MercadoPagoService } from "@/services/MercadoPagoService";
import { BillingService } from "@/services/BillingService";
import { mapMpPaymentToPaymentDocument } from "@/lib/mercadopago/map-mp-payment-to-doc";
import { processPaymentResult, type MpPaymentLike } from "@/lib/mercadopago/process-payment-result";

export type ProcessWebhookEventParams = { eventId: string; topic: string; resourceId: string };

export async function processWebhookEventByTopic(
  params: ProcessWebhookEventParams
): Promise<{ success: boolean; error?: string }> {
  const { eventId, topic, resourceId } = params;
  try {
    if (topic === "payment" || topic === "payments") {
      const mpPayment = await MercadoPagoService.getPaymentById(resourceId);
      if (!mpPayment) {
        const ev = await webhookEventsRepo.getById(eventId);
        await webhookEventsRepo.update(eventId, {
          status: "failed",
          lastError: "Payment not found in MP",
          retryCount: (ev?.retryCount ?? 0) + 1,
        });
        return { success: false, error: "Payment not found in MP" };
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
      await processPaymentResult(mpPayment as unknown as MpPaymentLike, { auditLogPrefix: "[MP Webhook Retry]" });
    } else if (topic === "topic_chargebacks_wh") {
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
      await MercadoPagoService.getClaimById(resourceId);
    }
    const ev = await webhookEventsRepo.getById(eventId);
    await webhookEventsRepo.update(eventId, {
      status: "processed",
      processedAt: Date.now(),
      retryCount: (ev?.retryCount ?? 0) + 1,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const ev = await webhookEventsRepo.getById(eventId);
    await webhookEventsRepo.update(eventId, {
      status: "failed",
      lastError: message.slice(0, 500),
      retryCount: (ev?.retryCount ?? 0) + 1,
    });
    return { success: false, error: message };
  }
}
