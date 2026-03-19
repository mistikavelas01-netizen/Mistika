import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { RefundType } from "@/firebase/repos";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { clearSalesAnalyticsCache } from "@/modules/sales-analytics/cache";
import { refundOrderPayment } from "@/services/refundService";
import { HttpError } from "../../../../_utils/errors";
import { withApiRoute } from "../../../../_utils/with-api-route";

export const POST = withApiRoute(
  { route: "/api/admin/orders/[orderId]/refund" },
  async (
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> },
  ) => {
    const auth = await requireAdminAuth(request);
    if (!auth.success) return auth.response;

    const { orderId } = await params;
    const body = (await request.json()) as {
      type?: RefundType;
      amount?: number;
      reason?: string;
    };

    if (body.type !== "full" && body.type !== "partial") {
      throw new HttpError(
        "El tipo de reembolso debe ser full o partial",
        400,
        "INVALID_REFUND_TYPE",
        true,
      );
    }

    const amount =
      body.amount === undefined ? undefined : Number(body.amount);

    if (
      body.type === "partial" &&
      (!Number.isFinite(amount) || Number(amount) <= 0)
    ) {
      throw new HttpError(
        "El monto parcial debe ser mayor a 0",
        400,
        "INVALID_REFUND_AMOUNT",
        true,
      );
    }

    const idempotencyKey =
      request.headers.get("x-idempotency-key")?.trim() ||
      request.headers.get("x-request-id")?.trim() ||
      crypto.randomUUID();

    const result = await refundOrderPayment({
      orderId,
      type: body.type,
      amount,
      reason: typeof body.reason === "string" ? body.reason : "",
      adminId: auth.payload.sub ?? "unknown",
      adminUsername: auth.payload.username,
      idempotencyKey,
    });

    clearSalesAnalyticsCache();

    return NextResponse.json({
      success: true,
      data: {
        refund: result.refund,
        payment: result.payment,
      },
      message: result.replayed
        ? "Se devolvió la respuesta de un reembolso ya procesado"
        : "Reembolso procesado correctamente",
    });
  },
);
