import "server-only";
import {
  paymentsRepo,
  ordersRepo,
  type OrderEntity,
  type PaymentEntity,
} from "@/firebase/repos";
import {
  isApprovedStatus,
  isPendingStatus,
  isRejectedOrCancelledStatus,
  isRefundStatus,
  isChargebackStatus,
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
export async function handlePendingPayment(payment: PaymentEntity): Promise<void> {
  void payment;
}

/**
 * Do not activate access; optionally notify user.
 */
export async function handleRejectedPayment(payment: PaymentEntity): Promise<void> {
  void payment;
}

/**
 * Deactivate access for a voluntary refund. Idempotent.
 */
export async function handleRefundedPayment(payment: PaymentEntity): Promise<void> {
  if (!payment._id) return;
  const current = await paymentsRepo.getById(payment._id);
  if (!current) return;
  if (!current.accessActive) return;
  await paymentsRepo.update(payment._id, { accessActive: false });
}

/**
 * Deactivate access and mark as risk for chargebacks. Idempotent.
 */
export async function handleRefundOrChargeback(payment: PaymentEntity): Promise<void> {
  if (!payment._id) return;
  const current = await paymentsRepo.getById(payment._id);
  if (!current) return;
  if (!current.accessActive && current.riskFlagged) return;
  await paymentsRepo.update(payment._id, {
    accessActive: false,
    riskFlagged: true,
  });
}

function getOrderPaymentStatusFromPayment(
  payment: PaymentEntity,
): OrderEntity["paymentStatus"] | null {
  const status = (payment.status ?? "").toLowerCase();
  if (isRefundStatus(status)) return "refunded";
  if (isApprovedStatus(status)) return "paid";
  if (isPendingStatus(status)) return "pending";
  if (isRejectedOrCancelledStatus(status) || isChargebackStatus(status)) {
    return "failed";
  }
  return null;
}

async function syncOrdersFromPayment(payment: PaymentEntity): Promise<void> {
  const paymentId = payment.mpPaymentId?.trim();
  if (!paymentId) return;

  const orders = await ordersRepo.where(
    "mpPaymentId" as keyof OrderEntity,
    "==",
    paymentId,
  );
  if (orders.length === 0) return;

  const nextPaymentStatus = getOrderPaymentStatusFromPayment(payment);
  const nextRefundStatus = payment.refundStatus ?? "none";
  const nextRefundedAmount = payment.refundedAmount ?? 0;

  await Promise.all(
    orders.map(async (order) => {
      if (!order._id) return;

      const updateData: Partial<OrderEntity> = {};

      if (nextPaymentStatus && order.paymentStatus !== nextPaymentStatus) {
        updateData.paymentStatus = nextPaymentStatus;
      }

      if ((order.refundStatus ?? "none") !== nextRefundStatus) {
        updateData.refundStatus = nextRefundStatus;
      }

      if (Number(order.refundedAmount ?? 0) !== nextRefundedAmount) {
        updateData.refundedAmount = nextRefundedAmount;
      }

      if (payment.lastRefundAt !== undefined) {
        updateData.lastRefundAt = payment.lastRefundAt ?? null;
      }

      if (payment.lastRefundReason !== undefined) {
        updateData.lastRefundReason = payment.lastRefundReason ?? null;
      }

      if (Object.keys(updateData).length > 0) {
        await ordersRepo.update(order._id, updateData);
      }
    }),
  );
}

/**
 * Route payment to the correct handler by status.
 */
export async function routeByPaymentStatus(payment: PaymentEntity): Promise<void> {
  const status = (payment.status ?? "").toLowerCase();
  if (isApprovedStatus(status)) await handleApprovedPayment(payment);
  else if (isPendingStatus(status)) await handlePendingPayment(payment);
  else if (isRejectedOrCancelledStatus(status)) await handleRejectedPayment(payment);
  else if (isRefundStatus(status)) await handleRefundedPayment(payment);
  else if (isChargebackStatus(status)) await handleRefundOrChargeback(payment);

  await syncOrdersFromPayment(payment);
}
