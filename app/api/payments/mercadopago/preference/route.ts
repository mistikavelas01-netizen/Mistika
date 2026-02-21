import { NextRequest, NextResponse } from "next/server";
import { getPreferenceClient, isMercadoPagoConfigured } from "@/lib/mercadopago/client";
import { orderDraftsRepo, checkoutOrdersRepo } from "../../../_utils/repos";
import { getAppBaseUrl } from "@/lib/app-url";
import { withDependency } from "../../../_utils/dependencies";
import { logger } from "../../../_utils/logger";
import { withApiRoute } from "../../../_utils/with-api-route";

/**
 * POST /api/payments/mercadopago/preference
 *
 * Recibe: draftId (borrador creado antes del pago), payer (opcional)
 * Crea una orden de checkout (CREATED) en BD, luego la preferencia en MP con external_reference = checkoutOrderId.
 * Devuelve: init_point, sandbox_init_point, preferenceId, orderId (checkoutOrderId).
 *
 * back_urls apuntan a /checkout/return (MP añade payment_id, preference_id, status).
 * La orden final (orders) se crea cuando el webhook o verify confirman approved.
 */
export const POST = withApiRoute({ route: "/api/payments/mercadopago/preference" }, async (request: NextRequest) => {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { success: false, error: "Mercado Pago no está configurado (MERCADOPAGO_ACCESS_TOKEN)" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      draftId: string;
      payer?: { email?: string; name?: string };
    };

    const draftId = body?.draftId;
    if (!draftId || typeof draftId !== "string") {
      return NextResponse.json(
        { success: false, error: "draftId es requerido" },
        { status: 400 }
      );
    }

    const draft = await orderDraftsRepo.getById(draftId);
    if (!draft) {
      return NextResponse.json(
        { success: false, error: "Borrador no encontrado" },
        { status: 404 }
      );
    }

    if (draft.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "El borrador ya fue procesado" },
        { status: 400 }
      );
    }

    const baseUrl = getAppBaseUrl();
    const isAbsoluteUrl = baseUrl.startsWith("http://") || baseUrl.startsWith("https://");
    if (!baseUrl || !isAbsoluteUrl) {
      logger.error("mp.preference_invalid_base_url", { baseUrl });
      return NextResponse.json(
        {
          success: false,
          error:
            "Configura NEXT_PUBLIC_APP_URL o VERCEL_URL con una URL absoluta (ej. https://tudominio.com o http://localhost:3000)",
        },
        { status: 500 }
      );
    }

    // 1) Crear orden de checkout en BD (CREATED) antes de llamar a MP
    const checkoutOrder = await checkoutOrdersRepo.create({
      draftId,
      status: "CREATED",
      preferenceId: null,
      initPoint: null,
      convertedOrderId: null,
      orderNumber: null,
      currency: "MXN",
      totalAmount: draft.totalAmount,
    });
    const checkoutOrderId = checkoutOrder._id!;

    const productItems = draft.items.map((i) => ({
      id: i.productId,
      title: i.productName || "Producto",
      quantity: i.quantity,
      unit_price: i.unitPrice,
      currency_id: "MXN" as const,
    }));

    const shippingCost = Number(draft.shippingCost) || 0;
    const tax = Number(draft.tax) || 0;

    const items = [...productItems];
    if (shippingCost > 0) {
      items.push({
        id: "envio",
        title: "Envío",
        quantity: 1,
        unit_price: shippingCost,
        currency_id: "MXN" as const,
      });
    }
    if (tax > 0) {
      items.push({
        id: "iva",
        title: "IVA (16%)",
        quantity: 1,
        unit_price: tax,
        currency_id: "MXN" as const,
      });
    }

    const returnBase = `${baseUrl}/checkout/return`;
    const preferenceBody = {
      items,
      external_reference: checkoutOrderId,
      back_urls: {
        success: returnBase,
        failure: returnBase,
        pending: returnBase,
      },
      auto_return: "approved" as const,
      payer: body.payer
        ? {
            email: body.payer.email ?? draft.customerEmail,
            name: body.payer.name ?? draft.customerName,
          }
        : {
            email: draft.customerEmail,
            name: draft.customerName,
          },
      notification_url: `${baseUrl}/api/webhooks/mercadopago?source_news=webhooks`,
      binary_mode: true,
    };

    const client = getPreferenceClient();
    const result = await withDependency(
      { name: "mercadopago", operation: "preference.create" },
      () => client.create({ body: preferenceBody })
    );

    const preferenceId = result?.id ?? null;
    const initPoint = result?.init_point ?? null;
    const sandboxInitPoint = result?.sandbox_init_point ?? null;

    if (!preferenceId || !initPoint) {
      logger.error("mp.preference_invalid_response", { hasPreferenceId: !!preferenceId, hasInitPoint: !!initPoint });
      await checkoutOrdersRepo.update(checkoutOrderId, { status: "FAILED" });
      return NextResponse.json(
        { success: false, error: "Error al crear la preferencia en Mercado Pago" },
        { status: 500 }
      );
    }

    await checkoutOrdersRepo.update(checkoutOrderId, {
      status: "CHECKOUT_STARTED",
      preferenceId,
      initPoint,
    });

    if (!sandboxInitPoint) {
      logger.warn("mp.preference_missing_sandbox_init_point");
    }

    return NextResponse.json({
      success: true,
      data: {
        init_point: initPoint,
        sandbox_init_point: sandboxInitPoint,
        preferenceId,
        orderId: checkoutOrderId,
      },
    });
  } catch (error) {
    logger.error("mp.preference_failed", { error });
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { success: false, error: `Error al crear preferencia: ${message}` },
      { status: 500 }
    );
  }
});
