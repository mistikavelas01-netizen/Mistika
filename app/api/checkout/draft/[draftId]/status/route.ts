import { NextRequest, NextResponse } from "next/server";
import { orderDraftsRepo } from "../../../../_utils/repos";
import { logger } from "../../../../_utils/logger";
import { withApiRoute } from "../../../../_utils/with-api-route";

/**
 * GET /api/checkout/draft/[draftId]/status
 *
 * Devuelve el estado del borrador. Si ya fue convertido en orden, incluye orderId y orderNumber.
 * Usado por la página de success para saber cuándo redirigir al detalle del pedido.
 */
export const GET = withApiRoute(
  { route: "/api/checkout/draft/[draftId]/status" },
  async (request: NextRequest, { params }: { params: Promise<{ draftId: string }> }) => {
  try {
    const { draftId } = await params;
    const draft = await orderDraftsRepo.getById(draftId);

    if (!draft) {
      return NextResponse.json({ success: false, error: "Borrador no encontrado" }, { status: 404 });
    }

    if (draft.status === "converted" && draft.convertedOrderId && draft.orderNumber) {
      return NextResponse.json({
        success: true,
        data: {
          status: "converted",
          orderId: draft.convertedOrderId,
          orderNumber: draft.orderNumber,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { status: draft.status },
    });
  } catch (error) {
    logger.error("checkout.draft_status_failed", { error });
    return NextResponse.json({ success: false, error: "Error al consultar estado" }, { status: 500 });
  }
});
