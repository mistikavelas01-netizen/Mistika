import "server-only";
import type { PaymentStatus } from "@/firebase/repos";

/**
 * Map Mercado Pago payment status to our Payment entity status.
 */
export const MP_STATUS_TO_PAYMENT_STATUS: Record<string, PaymentStatus> = {
  approved: "approved",
  pending: "pending",
  in_process: "in_process",
  in_mediation: "in_mediation",
  in_collection: "pending",
  rejected: "rejected",
  cancelled: "cancelled",
  refunded: "refunded",
  charged_back: "charged_back",
  expired: "expired",
};

export function mpStatusToPaymentStatus(mpStatus: string): PaymentStatus {
  const normalized = (mpStatus ?? "").toLowerCase();
  return MP_STATUS_TO_PAYMENT_STATUS[normalized] ?? "pending";
}

export function isApprovedStatus(s: string): boolean {
  return (s ?? "").toLowerCase() === "approved";
}

export function isPendingStatus(s: string): boolean {
  const set = new Set(["pending", "in_process", "in_mediation", "in_collection"]);
  return set.has((s ?? "").toLowerCase());
}

export function isRejectedOrCancelledStatus(s: string): boolean {
  const set = new Set(["rejected", "cancelled"]);
  return set.has((s ?? "").toLowerCase());
}

export function isRefundOrChargebackStatus(s: string): boolean {
  const set = new Set(["refunded", "charged_back"]);
  return set.has((s ?? "").toLowerCase());
}
