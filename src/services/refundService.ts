import "server-only";
import {
  ordersRepo,
  paymentsRepo,
  refundsRepo,
  type PaymentEntity,
  type RefundEntity,
  type RefundSummaryStatus,
  type RefundType,
} from "@/firebase/repos";
import { getMercadoPagoPayment } from "@/lib/mercadopago/get-payment";
import { getPaymentRefundClient } from "@/lib/mercadopago/client";
import {
  buildRefundSummaryFromMpPayment,
  getRemainingRefundableAmount,
  roundCurrency,
} from "@/lib/mercadopago/refund-summary";
import {
  mapMpPaymentToPaymentDocument,
  type MpPaymentLike,
} from "@/lib/mercadopago/map-mp-payment-to-doc";
import { routeByPaymentStatus } from "@/services/BillingService";
import { withDependency } from "../../app/api/_utils/dependencies";
import { HttpError } from "../../app/api/_utils/errors";
import { logger } from "../../app/api/_utils/logger";

type RefundServiceInput = {
  orderId: string;
  type: RefundType;
  amount?: number;
  reason: string;
  adminId: string;
  adminUsername?: string;
  idempotencyKey: string;
};

type RefundServiceResult = {
  refund: RefundEntity;
  replayed: boolean;
  payment: {
    paymentStatus: PaymentEntity["status"];
    refundStatus: RefundSummaryStatus;
    refundedAmount: number;
  };
};

type MpRefundResponse = {
  id?: number;
  amount?: number;
  status?: string;
  date_created?: string;
};

function normalizeReason(reason: string): string {
  return reason.trim().slice(0, 500);
}

function buildRefundResult(
  refund: RefundEntity,
  payment: PaymentEntity,
  replayed: boolean,
): RefundServiceResult {
  return {
    refund,
    replayed,
    payment: {
      paymentStatus: payment.status,
      refundStatus: payment.refundStatus ?? "none",
      refundedAmount: Number(payment.refundedAmount ?? 0),
    },
  };
}

function buildFallbackPaymentSnapshot(
  payment: MpPaymentLike,
  refund: MpRefundResponse,
  requestedAmount: number,
  originalRemaining: number,
): MpPaymentLike {
  const existingRefunds = Array.isArray(payment.refunds) ? payment.refunds : [];
  const processedAmount = roundCurrency(Number(refund.amount ?? requestedAmount));
  const nextRefundedAmount = roundCurrency(
    Number(payment.transaction_amount_refunded ?? 0) + processedAmount,
  );
  const shouldBeFullRefund = processedAmount >= originalRemaining - 0.01;

  return {
    ...payment,
    status: shouldBeFullRefund ? "refunded" : payment.status,
    transaction_amount_refunded: nextRefundedAmount,
    refunds: [
      ...existingRefunds,
      {
        amount: processedAmount,
        date_created: refund.date_created,
        status: refund.status,
      },
    ],
  };
}

async function upsertPaymentFromSnapshot(
  paymentSnapshot: MpPaymentLike,
  lastRefundReason: string,
): Promise<PaymentEntity & { _id: string }> {
  const paymentDoc = {
    ...mapMpPaymentToPaymentDocument(paymentSnapshot),
    lastRefundReason,
  };

  const existing = await paymentsRepo.where(
    "mpPaymentId" as keyof PaymentEntity,
    "==",
    paymentDoc.mpPaymentId,
  );

  if (existing.length > 0) {
    await paymentsRepo.update(existing[0]._id!, paymentDoc);
    return {
      ...existing[0],
      ...paymentDoc,
      _id: existing[0]._id!,
    };
  }

  const created = await paymentsRepo.create(paymentDoc as PaymentEntity);
  return created as PaymentEntity & { _id: string };
}

export async function refundOrderPayment(
  input: RefundServiceInput,
): Promise<RefundServiceResult> {
  const order = await ordersRepo.getById(input.orderId);
  if (!order) {
    throw new HttpError(
      "Pedido no encontrado",
      404,
      "ORDER_NOT_FOUND",
      true,
    );
  }

  const paymentId = order.mpPaymentId?.trim();
  if (!paymentId) {
    throw new HttpError(
      "El pedido no tiene un pago de Mercado Pago asociado",
      409,
      "PAYMENT_NOT_LINKED",
      true,
    );
  }

  const reason = normalizeReason(input.reason);
  if (!reason) {
    throw new HttpError(
      "Debes indicar el motivo del reembolso",
      400,
      "INVALID_REFUND_REASON",
      true,
    );
  }

  const existingByKey = await refundsRepo.where(
    "idempotencyKey",
    "==",
    input.idempotencyKey,
  );

  if (existingByKey[0]) {
    const existingRefund = existingByKey[0];
    if (existingRefund.status === "processing") {
      throw new HttpError(
        "Ya existe un reembolso en proceso para esta operación",
        409,
        "REFUND_IN_PROGRESS",
        true,
      );
    }

    if (
      existingRefund.status === "succeeded" ||
      existingRefund.status === "reconciled"
    ) {
      const currentPayments = await paymentsRepo.where(
        "mpPaymentId" as keyof PaymentEntity,
        "==",
        paymentId,
      );
      const currentPayment =
        currentPayments[0] ??
        ({
          mpPaymentId: paymentId,
          status: "approved",
          amount: Number(order.totalAmount ?? 0),
          currency: String(order.currency ?? "MXN"),
          accessActive: true,
          refundStatus: existingRefund.summaryStatus,
          refundedAmount: existingRefund.processedAmount,
        } as PaymentEntity);
      return buildRefundResult(existingRefund, currentPayment, true);
    }

    throw new HttpError(
      "La llave de idempotencia ya fue usada en un intento previo",
      409,
      "REFUND_KEY_ALREADY_USED",
      true,
    );
  }

  const mpPaymentBefore = await withDependency(
    { name: "mercadopago", operation: "payment.get" },
    () => getMercadoPagoPayment(paymentId),
  );

  if (!mpPaymentBefore) {
    throw new HttpError(
      "No se encontró el pago en Mercado Pago",
      404,
      "MP_PAYMENT_NOT_FOUND",
      true,
    );
  }

  const mpStatus = String(mpPaymentBefore.status ?? "").toLowerCase();
  const remainingAmount = getRemainingRefundableAmount(mpPaymentBefore);
  if (remainingAmount <= 0) {
    throw new HttpError(
      "El pago ya no tiene monto disponible para reembolso",
      409,
      "PAYMENT_ALREADY_REFUNDED",
      true,
    );
  }

  if (mpStatus !== "approved") {
    throw new HttpError(
      `El pago no es reembolsable en su estado actual (${mpStatus})`,
      409,
      "PAYMENT_NOT_REFUNDABLE",
      true,
    );
  }

  const requestedAmount =
    input.type === "full"
      ? remainingAmount
      : roundCurrency(Number(input.amount ?? 0));

  if (input.type === "partial" && requestedAmount <= 0) {
    throw new HttpError(
      "El monto parcial debe ser mayor a 0",
      400,
      "INVALID_REFUND_AMOUNT",
      true,
    );
  }

  if (requestedAmount > remainingAmount + 0.01) {
    throw new HttpError(
      "El monto solicitado excede lo que queda por reembolsar",
      422,
      "REFUND_AMOUNT_EXCEEDS_REMAINING",
      true,
    );
  }

  const refundRecord = await refundsRepo.create({
    orderId: order._id!,
    mpPaymentId: paymentId,
    mpRefundId: null,
    type: input.type,
    requestedAmount,
    processedAmount: 0,
    currency: String(order.currency ?? "MXN"),
    reason,
    status: "processing",
    summaryStatus: "none",
    idempotencyKey: input.idempotencyKey,
    requestedByAdminId: input.adminId,
    requestedByAdminUsername: input.adminUsername ?? null,
    processorStatus: null,
    raw: null,
    errorMessage: null,
    refundedAt: null,
  });

  try {
    const refundClient = getPaymentRefundClient();
    const mpRefund = (await withDependency(
      { name: "mercadopago", operation: "payment.refund" },
      () =>
        input.type === "full"
          ? refundClient.total({
              payment_id: paymentId,
              requestOptions: { idempotencyKey: input.idempotencyKey },
            })
          : refundClient.create({
              payment_id: paymentId,
              body: { amount: requestedAmount },
              requestOptions: { idempotencyKey: input.idempotencyKey },
            }),
    )) as MpRefundResponse;

    let latestPayment: MpPaymentLike | null = null;
    try {
      latestPayment = await withDependency(
        { name: "mercadopago", operation: "payment.get" },
        () => getMercadoPagoPayment(paymentId),
      );
    } catch (error) {
      logger.warn("orders.refund_payment_refresh_failed", {
        orderId: order._id,
        paymentId,
        error,
      });
    }

    const fallbackPayment = buildFallbackPaymentSnapshot(
      mpPaymentBefore,
      mpRefund,
      requestedAmount,
      remainingAmount,
    );
    const fallbackSummary = buildRefundSummaryFromMpPayment(fallbackPayment);
    const latestSummary = latestPayment
      ? buildRefundSummaryFromMpPayment(latestPayment)
      : null;

    const selectedPayment =
      latestPayment &&
      latestSummary &&
      latestSummary.refundedAmount >= fallbackSummary.refundedAmount - 0.01
        ? latestPayment
        : fallbackPayment;

    const paymentEntity = await upsertPaymentFromSnapshot(selectedPayment, reason);
    await routeByPaymentStatus(paymentEntity);

    const refreshedRefund = {
      mpRefundId: mpRefund.id != null ? String(mpRefund.id) : null,
      processedAmount: roundCurrency(Number(mpRefund.amount ?? requestedAmount)),
      status: "succeeded" as const,
      summaryStatus: paymentEntity.refundStatus ?? fallbackSummary.refundStatus,
      processorStatus:
        mpRefund.status != null ? String(mpRefund.status) : null,
      raw: mpRefund as unknown as Record<string, unknown>,
      errorMessage: null,
      refundedAt: paymentEntity.lastRefundAt ?? Date.now(),
    };

    await refundsRepo.update(refundRecord._id!, refreshedRefund);
    const updatedRefund = await refundsRepo.getById(refundRecord._id!);

    if (!updatedRefund) {
      throw new HttpError(
        "No se pudo recuperar el reembolso guardado",
        500,
        "REFUND_PERSISTENCE_ERROR",
        true,
      );
    }

    logger.info("orders.refund_succeeded", {
      orderId: order._id,
      paymentId,
      refundId: updatedRefund._id,
      mpRefundId: refreshedRefund.mpRefundId,
      type: input.type,
      amount: refreshedRefund.processedAmount,
      summaryStatus: refreshedRefund.summaryStatus,
      replayed: false,
    });

    return buildRefundResult(updatedRefund, paymentEntity, false);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo procesar el reembolso";

    await refundsRepo.update(refundRecord._id!, {
      status: "failed",
      errorMessage: message.slice(0, 500),
    });

    logger.error("orders.refund_failed", {
      orderId: order._id,
      paymentId,
      refundId: refundRecord._id,
      type: input.type,
      amount: requestedAmount,
      error,
    });

    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(
      "Mercado Pago no pudo procesar el reembolso",
      502,
      "REFUND_FAILED",
      true,
    );
  }
}
