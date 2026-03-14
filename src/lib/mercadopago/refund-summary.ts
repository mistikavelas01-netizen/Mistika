import "server-only";
import type { RefundSummaryStatus } from "@/firebase/repos";

export type MpRefundLike = {
  amount?: number;
  date_created?: string;
  status?: string;
};

export type MpPaymentRefundSummaryLike = {
  status?: string;
  transaction_amount?: number;
  transaction_amount_refunded?: number;
  refunds?: MpRefundLike[] | null;
};

export const roundCurrency = (value: number) =>
  Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

export function getRefundedAmountFromMpPayment(
  payment: MpPaymentRefundSummaryLike,
): number {
  const explicitRefunded = Number(payment?.transaction_amount_refunded);
  if (Number.isFinite(explicitRefunded)) {
    return roundCurrency(explicitRefunded);
  }

  if (Array.isArray(payment?.refunds)) {
    const fromRefunds = payment.refunds.reduce(
      (sum, refund) => sum + Number(refund?.amount ?? 0),
      0,
    );
    return roundCurrency(fromRefunds);
  }

  return 0;
}

export function getLastRefundAtFromMpPayment(
  payment: MpPaymentRefundSummaryLike,
): number | null {
  if (!Array.isArray(payment?.refunds) || payment.refunds.length === 0) {
    return null;
  }

  const timestamps = payment.refunds
    .map((refund) => {
      const raw = refund?.date_created;
      if (!raw) return null;
      const ts = new Date(raw).getTime();
      return Number.isFinite(ts) ? ts : null;
    })
    .filter((value): value is number => value !== null);

  if (timestamps.length === 0) return null;
  return Math.max(...timestamps);
}

export function getRefundSummaryStatusFromMpPayment(
  payment: MpPaymentRefundSummaryLike,
): RefundSummaryStatus {
  const total = roundCurrency(Number(payment?.transaction_amount ?? 0));
  const refunded = getRefundedAmountFromMpPayment(payment);
  const mpStatus = String(payment?.status ?? "").toLowerCase();

  if (mpStatus === "refunded") return "full";
  if (refunded <= 0) return "none";
  if (total > 0 && refunded >= total - 0.01) return "full";
  return "partial";
}

export function getRemainingRefundableAmount(
  payment: MpPaymentRefundSummaryLike,
): number {
  const total = roundCurrency(Number(payment?.transaction_amount ?? 0));
  const refunded = getRefundedAmountFromMpPayment(payment);
  return roundCurrency(Math.max(0, total - refunded));
}

export function buildRefundSummaryFromMpPayment(
  payment: MpPaymentRefundSummaryLike,
): {
  refundedAmount: number;
  refundStatus: RefundSummaryStatus;
  lastRefundAt: number | null;
} {
  return {
    refundedAmount: getRefundedAmountFromMpPayment(payment),
    refundStatus: getRefundSummaryStatusFromMpPayment(payment),
    lastRefundAt: getLastRefundAtFromMpPayment(payment),
  };
}
