import "server-only";
import type { CheckoutOrderStatus } from "@/firebase/repos";

/**
 * Mapeo de estados de Mercado Pago a CheckoutOrderStatus.
 * Ref: https://www.mercadopago.com.mx/developers/es/docs/checkout-api/landing
 */
export const MP_STATUS_TO_CHECKOUT_STATUS: Record<string, CheckoutOrderStatus> = {
  approved: "APPROVED",
  pending: "PENDING",
  in_process: "PENDING",
  in_mediation: "PENDING",
  in_collection: "PENDING",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  refunded: "APPROVED",
  charged_back: "APPROVED",
  expired: "EXPIRED",
};

/** Status de pago MP que consideramos "pendiente" (no aprobado ni fallido final) */
export const MP_PENDING_STATUSES = new Set([
  "pending",
  "in_process",
  "in_mediation",
  "in_collection",
]);

/** Status de pago MP que consideramos "aprobado" (orden se confirma) */
export const MP_APPROVED_STATUSES = new Set(["approved", "refunded", "charged_back"]);

/** Status de pago MP que consideramos "rechazado/cancelado/fallido" */
export const MP_FAILED_STATUSES = new Set(["rejected", "cancelled"]);

export function mpStatusToCheckoutStatus(mpStatus: string): CheckoutOrderStatus {
  return MP_STATUS_TO_CHECKOUT_STATUS[mpStatus] ?? "PENDING";
}

export function isApproved(mpStatus: string): boolean {
  return MP_APPROVED_STATUSES.has(mpStatus);
}

export function isPending(mpStatus: string): boolean {
  return MP_PENDING_STATUSES.has(mpStatus);
}

export function isFailed(mpStatus: string): boolean {
  return MP_FAILED_STATUSES.has(mpStatus);
}
