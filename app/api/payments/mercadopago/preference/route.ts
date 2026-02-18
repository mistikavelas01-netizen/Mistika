import { NextRequest, NextResponse } from "next/server";
import { getPreferenceClient, isMercadoPagoConfigured } from "@/lib/mercadopago/client";
import { orderDraftsRepo } from "@/firebase/repos";
import { getAppBaseUrl } from "@/lib/app-url";

/**
 * POST /api/payments/mercadopago/preference
 *
 * Recibe: draftId (borrador creado antes del pago), payer (opcional)
 * Devuelve: init_point, sandbox_init_point, preferenceId
 *
 * La orden se crea cuando el webhook confirma el pago aprobado.
 */
export async function POST(request: NextRequest) {
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

    const items = draft.items.map((i) => ({
      id: i.productId,
      title: i.productName || "Producto",
      quantity: i.quantity,
      unit_price: i.unitPrice,
      currency_id: "MXN" as const,
    }));

    const baseUrl = getAppBaseUrl();
    const isAbsoluteUrl = baseUrl.startsWith("http://") || baseUrl.startsWith("https://");
    if (!baseUrl || !isAbsoluteUrl) {
      console.error("[MP Preference] APP URL inválida (debe ser absoluta):", baseUrl);
      return NextResponse.json(
        {
          success: false,
          error:
            "Configura NEXT_PUBLIC_APP_URL o VERCEL_URL con una URL absoluta (ej. https://tudominio.com o http://localhost:3000)",
        },
        { status: 500 }
      );
    }

    const successUrl = `${baseUrl}/orders/payment/success?draftId=${draftId}`;
    const failureUrl = `${baseUrl}/orders/payment/failure?draftId=${draftId}`;
    const pendingUrl = `${baseUrl}/orders/payment/pending?draftId=${draftId}`;

    const preferenceBody = {
      items,
      external_reference: draftId,
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
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
    };

    const client = getPreferenceClient();
    const result = await client.create({ body: preferenceBody });

    console.log("[MP Preference] Resultado:", JSON.stringify(result, null, 2));

    const preferenceId = result?.id;
    const initPoint = result?.init_point;
    const sandboxInitPoint = result?.sandbox_init_point ?? null;

    // Diagnóstico: con credenciales de prueba MP suele devolver sandbox_init_point
    if (!sandboxInitPoint) {
      console.warn(
        "[MP Preference] sandbox_init_point no viene en la respuesta. Si usas tarjetas de prueba, asegúrate de usar Credenciales de prueba en MERCADOPAGO_ACCESS_TOKEN."
      );
    }

    if (!preferenceId || !initPoint) {
      console.error("[MP Preference] Invalid response:", result);
      return NextResponse.json(
        { success: false, error: "Error al crear la preferencia en Mercado Pago" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        init_point: initPoint,
        sandbox_init_point: sandboxInitPoint,
        preferenceId,
      },
    });
  } catch (error) {
    console.error("[MP Preference] Error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { success: false, error: `Error al crear preferencia: ${message}` },
      { status: 500 }
    );
  }
}
