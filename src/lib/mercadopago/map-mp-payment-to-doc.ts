import "server-only";
import type { PaymentEntity, PaymentStatus } from "@/firebase/repos";
import { mpStatusToPaymentStatus } from "./payment-status";

export type MpPaymentLike = {
  id?: string | number;
  status?: string;
  transaction_amount?: number;
  currency_id?: string;
  payer?: { email?: string; id?: string | number };
  external_reference?: string | null;
  metadata?: Record<string, unknown> | null;
  [k: string]: unknown;
};

/**
 * Build our Payment entity from MP payment response (enriched, not just webhook payload).
 */
export function mapMpPaymentToPaymentDocument(
  mp: MpPaymentLike
): Omit<PaymentEntity, "_id" | "createdAt" | "updatedAt"> {
  const mpPaymentId = String(mp?.id ?? "").trim();
  const mpStatus = (mp?.status ?? "").toLowerCase();
  const status = mpStatusToPaymentStatus(mpStatus);
  const amount = Number(mp?.transaction_amount) || 0;
  const currency = (mp?.currency_id ?? "MXN").toString();
  const payerEmail = mp?.payer?.email ? String(mp.payer.email) : undefined;
  const payerId = mp?.payer?.id != null ? String(mp.payer.id) : undefined;
  const externalReference =
    mp?.external_reference != null ? String(mp.external_reference).trim() : undefined;
  const metadata =
    mp?.metadata && typeof mp.metadata === "object" ? (mp.metadata as Record<string, unknown>) : undefined;
  const accessActive = status === "approved";
  const riskFlagged = status === "refunded" || status === "charged_back";

  return {
    mpPaymentId,
    status: status as PaymentStatus,
    amount,
    currency,
    payerEmail: payerEmail ?? null,
    payerId: payerId ?? null,
    externalReference: externalReference ?? null,
    metadata: metadata ?? null,
    accessActive,
    riskFlagged: riskFlagged ? true : null,
    lastMpStatus: mpStatus || null,
    lastSyncedAt: Date.now(),
  };
}
