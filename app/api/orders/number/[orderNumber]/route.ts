import { NextRequest, NextResponse } from "next/server";
import {
  ordersRepo,
} from "../../../_utils/repos";
import { verifyOrderToken } from "@/lib/order-token";
import { isAdminRequest } from "@/lib/auth/api-helper";
import { logger } from "../../../_utils/logger";
import { withApiRoute } from "../../../_utils/with-api-route";
import { enrichOrderWithItemsAndCategory } from "../../_utils/enrich-order";

export const GET = withApiRoute(
  { route: "/api/orders/number/[orderNumber]" },
  async (request: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) => {
  try {
    const { orderNumber } = await params;
    const adminAccess = await isAdminRequest(request);
    const token = request.nextUrl.searchParams.get("token");
    const expires = request.nextUrl.searchParams.get("expires");
    if (!adminAccess && (!token || !expires)) {
      return NextResponse.json(
        {
          success: false,
          error: "Token requerido para acceder a los detalles del pedido",
        },
        { status: 401 }
      );
    }

    const orders = await ordersRepo.where("orderNumber", "==", orderNumber);
    const order = orders[0] ?? null;

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (!adminAccess && (!order._id || !verifyOrderToken(order._id, token!, expires!))) {
      return NextResponse.json(
        {
          success: false,
          error: "Token inválido o no autorizado para este pedido",
        },
        { status: 403 }
      );
    }

    const data = await enrichOrderWithItemsAndCategory(order);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("orders.fetch_by_number_failed", { error });
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el pedido" },
      { status: 500 }
    );
  }
});
