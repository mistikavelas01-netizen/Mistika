import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/lib/mercadopago/get-payment";
import { checkoutOrdersRepo } from "../../../_utils/repos";
import { isMercadoPagoConfigured } from "@/lib/mercadopago/client";
import { processPaymentResult, type MpPaymentLike } from "@/lib/mercadopago/process-payment-result";
import { withDependency } from "../../../_utils/dependencies";
import { logger } from "../../../_utils/logger";
import { withApiRoute } from "../../../_utils/with-api-route";

/**
 * GET /api/payments/mercadopago/verify
 *
 * Parámetros de retorno de MP (query): payment_id, preference_id, status, merchant_order_id, etc.
 * Consulta el estado REAL del pago en Mercado Pago (Payments API), actualiza la orden en BD
 * y devuelve un payload claro para el frontend.
 */
export const GET = withApiRoute({ route: "/api/payments/mercadopago/verify" }, async (request: NextRequest) => {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { success: false, error: "Mercado Pago no está configurado", orderId: null, status: "FAILED", canRetry: true, nextAction: "config_error" },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const paymentId = searchParams.get("payment_id") ?? searchParams.get("collection_id") ?? "";
  const preferenceId = searchParams.get("preference_id") ?? "";
  const merchantOrderId = searchParams.get("merchant_order_id") ?? "";

  const effectivePaymentId = paymentId.trim();
  const effectivePreferenceId = preferenceId.trim();

  if (!effectivePaymentId && !effectivePreferenceId) {
    return NextResponse.json({
      success: false,
      error: "Faltan payment_id o preference_id",
      orderId: null,
      status: "unknown",
      detail: "No se recibieron parámetros de retorno de Mercado Pago.",
      canRetry: true,
      nextAction: "retry_checkout",
    }, { status: 400 });
  }

  try {
    let mpPayment: Awaited<ReturnType<typeof getMercadoPagoPayment>> | null = null;

    if (effectivePaymentId) {
      try {
        mpPayment = await withDependency(
          { name: "mercadopago", operation: "payment.get" },
          () => getMercadoPagoPayment(effectivePaymentId)
        );
      } catch (err) {
        logger.error("mp.verify_fetch_failed", { error: err });
        return NextResponse.json({
          success: false,
          error: "No se pudo verificar el pago con Mercado Pago",
          orderId: null,
          status: "unknown",
          detail: "Error al consultar el pago.",
          canRetry: true,
          nextAction: "retry_checkout",
        }, { status: 502 });
      }
    }

    if (!mpPayment && effectivePreferenceId) {
      const orders = await checkoutOrdersRepo.where(
        "preferenceId" as keyof import("@/firebase/repos").CheckoutOrderEntity,
        "==",
        effectivePreferenceId
      );
      const checkoutOrder = orders[0] ?? null;
      if (checkoutOrder) {
        return NextResponse.json({
          success: true,
          orderId: checkoutOrder.convertedOrderId ?? checkoutOrder._id ?? null,
          orderNumber: checkoutOrder.orderNumber ?? null,
          status: checkoutOrder.status,
          detail: "Estado actual de la orden (sin payment_id en la URL).",
          canRetry: ["REJECTED", "CANCELLED", "EXPIRED", "FAILED"].includes(checkoutOrder.status),
          nextAction: checkoutOrder.status === "APPROVED" ? "go_orders" : checkoutOrder.status === "PENDING" ? "poll_or_wait" : "retry_checkout",
        });
      }
      return NextResponse.json({
        success: false,
        error: "Orden no encontrada",
        orderId: null,
        status: "unknown",
        detail: "Preference_id no asociado a ninguna orden.",
        canRetry: true,
        nextAction: "retry_checkout",
      }, { status: 404 });
    }

    if (!mpPayment) {
      return NextResponse.json({
        success: false,
        error: "No se pudo obtener el pago",
        orderId: null,
        status: "unknown",
        detail: "Falta payment_id o la consulta a MP falló.",
        canRetry: true,
        nextAction: "retry_checkout",
      }, { status: 400 });
    }

    const result = await withDependency(
      { name: "app", operation: "processPaymentResult" },
      () => processPaymentResult(mpPayment as unknown as MpPaymentLike, {
        auditLogPrefix: "[MP Verify]",
      })
    );

    const status = result.status;
    const orderId = result.orderId ?? result.checkoutOrder?.convertedOrderId ?? null;
    const orderNumber = result.orderNumber ?? result.checkoutOrder?.orderNumber ?? null;

    const canRetry = ["REJECTED", "CANCELLED", "EXPIRED", "FAILED"].includes(status);
    const nextAction =
      status === "APPROVED"
        ? "go_orders"
        : status === "PENDING"
          ? "poll_or_wait"
          : canRetry
            ? "retry_checkout"
            : "wait";

    return NextResponse.json({
      success: status === "APPROVED" || status === "PENDING",
      orderId,
      orderNumber,
      status,
      detail: status === "APPROVED"
        ? "Pago aprobado. Tu pedido fue confirmado."
        : status === "PENDING"
          ? "Pago pendiente de acreditar."
          : "El pago no se completó o fue rechazado.",
      canRetry,
      nextAction,
    });
  } catch (error) {
    logger.error("mp.verify_failed", { error });
    return NextResponse.json({
      success: false,
      error: "Error al verificar el pago",
      orderId: null,
      status: "unknown",
      detail: "Error interno.",
      canRetry: true,
      nextAction: "retry_checkout",
    }, { status: 500 });
  }
});
