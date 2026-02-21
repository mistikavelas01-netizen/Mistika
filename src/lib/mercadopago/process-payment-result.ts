import "server-only";
import {
  checkoutOrdersRepo,
  paymentAttemptsRepo,
  orderDraftsRepo,
  type CheckoutOrderEntity,
  type OrderDraftEntity,
} from "@/firebase/repos";
import { createOrderFromDraft } from "@/lib/order/create-order-from-draft";
import { mpStatusToCheckoutStatus, isApproved } from "./map-status";

export type MpPaymentLike = {
  id?: string | number;
  status?: string;
  external_reference?: string | null;
  metadata?: { preference_id?: string } | null;
  order_id?: string | number | null;
  [k: string]: unknown;
};

/**
 * Actualiza CheckoutOrder y PaymentAttempt según el pago de MP.
 * Idempotente: si ya existe PaymentAttempt con mismo paymentId y status aprobado y ya convertido, no duplica.
 * Si status es approved y el draft no está convertido, crea la orden desde el draft.
 */
export async function processPaymentResult(
  mpPayment: MpPaymentLike,
  options?: { auditLogPrefix?: string }
): Promise<{
  checkoutOrder: CheckoutOrderEntity | null;
  status: string;
  orderId: string | null;
  orderNumber: string | null;
  alreadyProcessed: boolean;
}> {
  const logPrefix = options?.auditLogPrefix ?? "[MP Process]";
  const paymentId = String(mpPayment?.id ?? "").trim();
  const mpStatus = (mpPayment?.status ?? "").toLowerCase();
  const externalRef = mpPayment?.external_reference;
  const checkoutOrderId = typeof externalRef === "string" ? externalRef.trim() : "";

  if (!paymentId || !checkoutOrderId) {
    console.warn(`${logPrefix} Missing paymentId or external_reference`);
    return {
      checkoutOrder: null,
      status: "unknown",
      orderId: null,
      orderNumber: null,
      alreadyProcessed: false,
    };
  }

  const checkoutOrder = await checkoutOrdersRepo.getById(checkoutOrderId);
  if (!checkoutOrder) {
    console.warn(`${logPrefix} CheckoutOrder not found: ${checkoutOrderId}`);
    return {
      checkoutOrder: null,
      status: mpStatusToCheckoutStatus(mpStatus),
      orderId: null,
      orderNumber: null,
      alreadyProcessed: false,
    };
  }

  const ourStatus = mpStatusToCheckoutStatus(mpStatus);

  const existingAttempts = await paymentAttemptsRepo.where(
    "paymentId" as keyof import("@/firebase/repos").PaymentAttemptEntity,
    "==",
    paymentId
  );
  const alreadyHadApproved =
    checkoutOrder.status === "APPROVED" && Boolean(checkoutOrder.convertedOrderId);
  if (existingAttempts.length > 0 && alreadyHadApproved) {
    console.log(`${logPrefix} Idempotency: payment ${paymentId} already processed for order ${checkoutOrderId}`);
    return {
      checkoutOrder,
      status: checkoutOrder.status,
      orderId: checkoutOrder.convertedOrderId ?? null,
      orderNumber: checkoutOrder.orderNumber ?? null,
      alreadyProcessed: true,
    };
  }

  const preferenceId = mpPayment?.metadata?.preference_id ?? null;
  const merchantOrderId = mpPayment?.order_id != null ? String(mpPayment.order_id) : null;

  if (existingAttempts.length === 0) {
    await paymentAttemptsRepo.create({
      checkoutOrderId,
      orderId: null,
      preferenceId: preferenceId ?? null,
      paymentId,
      merchantOrderId: merchantOrderId ?? null,
      status: ourStatus,
      raw: mpPayment ? (mpPayment as Record<string, unknown>) : null,
    });
  }

  await checkoutOrdersRepo.update(checkoutOrderId, {
    status: ourStatus,
  });

  if (isApproved(mpStatus)) {
    const draft = await orderDraftsRepo.getById(checkoutOrder.draftId);
    if (draft?.status === "pending") {
      const created = await createOrderFromDraft(
        draft,
        paymentId,
        preferenceId ?? undefined
      );
      if (created) {
        await checkoutOrdersRepo.update(checkoutOrderId, {
          convertedOrderId: created.orderId,
          orderNumber: created.orderNumber,
          status: "APPROVED",
        });
        console.log(
          `${logPrefix} Created order ${created.orderId} (${created.orderNumber}) from checkout ${checkoutOrderId}`
        );
        return {
          checkoutOrder: { ...checkoutOrder, status: "APPROVED", convertedOrderId: created.orderId, orderNumber: created.orderNumber },
          status: "APPROVED",
          orderId: created.orderId,
          orderNumber: created.orderNumber,
          alreadyProcessed: false,
        };
      }
    } else if (draft?.status === "converted" && draft.convertedOrderId && draft.orderNumber) {
      await checkoutOrdersRepo.update(checkoutOrderId, {
        convertedOrderId: draft.convertedOrderId,
        orderNumber: draft.orderNumber,
        status: "APPROVED",
      });
      return {
        checkoutOrder: {
          ...checkoutOrder,
          status: "APPROVED",
          convertedOrderId: draft.convertedOrderId,
          orderNumber: draft.orderNumber,
        },
        status: "APPROVED",
        orderId: draft.convertedOrderId,
        orderNumber: draft.orderNumber ?? null,
        alreadyProcessed: true,
      };
    }
  }

  return {
    checkoutOrder: { ...checkoutOrder, status: ourStatus },
    status: ourStatus,
    orderId: checkoutOrder.convertedOrderId ?? null,
    orderNumber: checkoutOrder.orderNumber ?? null,
    alreadyProcessed: false,
  };
}
