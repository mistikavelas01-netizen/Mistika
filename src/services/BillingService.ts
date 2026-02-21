import "server-only";
import { paymentsRepo, type PaymentEntity } from "@/firebase/repos";
import {
  isApprovedStatus,
  isPendingStatus,
  isRejectedOrCancelledStatus,
  isRefundOrChargebackStatus,
} from "@/lib/mercadopago/payment-status";

/**
 * Activate subscription/access for an approved payment. Idempotent.
 */
export async function handleApprovedPayment(payment: PaymentEntity): Promise<void> {
  if (!payment._id) return;
  const current = await paymentsRepo.getById(payment._id);
  if (!current) return;
  if (current.accessActive) return;
  await paymentsRepo.update(payment._id, { accessActive: true });
}

/**
 * Leave payment in pending; no access change.
 */
export async function handlePendingPayment(_payment: PaymentEntity): Promise<void> {}

/**
 * Do not activate access; optionally notify user.
 */
export async function handleRejectedPayment(payment: PaymentEntity): Promise<void> {
  void payment;
}

/**
 * Deactivate access and mark as risk. Idempotent.
 */
export async function handleRefundOrChargeback(payment: PaymentEntity): Promise<void> {
  if (!payment._id) return;
  const current = await paymentsRepo.getById(payment._id);
  if (!current) return;
  if (!current.accessActive && current.riskFlagged) return;
  await paymentsRepo.update(payment._id, { accessActive: false, riskFlagged: true });
}

/**
 * Route payment to the correct handler by status.
 */
export async function routeByPaymentStatus(payment: PaymentEntity): Promise<void> {
  const status = (payment.status ?? "").toLowerCase();
  if (isApprovedStatus(status)) await handleApprovedPayment(payment);
  else if (isPendingStatus(status)) await handlePendingPayment(payment);
  else if (isRejectedOrCancelledStatus(status)) await handleRejectedPayment(payment);
  else if (isRefundOrChargebackStatus(status)) await handleRefundOrChargeback(payment);
}
