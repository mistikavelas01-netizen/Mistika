import { NextRequest, NextResponse } from "next/server";
import { withApiRoute } from "../../../_utils/with-api-route";
import { logger } from "../../../_utils/logger";
import { getTopProducts } from "@/modules/sales-analytics/service";
import {
  getAnalyticsErrorResponse,
  getAnalyticsParamsFromRequest,
  requireAnalyticsAdminAuth,
} from "@/modules/sales-analytics/http";

export const GET = withApiRoute(
  { route: "/api/admin/analytics/top-products" },
  async (request: NextRequest) => {
    const auth = await requireAnalyticsAdminAuth(request);
    if (!auth.success) {
      return auth.response;
    }

    try {
      const data = await getTopProducts(getAnalyticsParamsFromRequest(request));

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error) {
      const handledResponse = getAnalyticsErrorResponse(error);
      if (handledResponse) {
        return handledResponse;
      }

      logger.error("analytics.top_products_failed", { error });
      return NextResponse.json(
        {
          success: false,
          error: "No se pudieron obtener los productos más vendidos",
        },
        { status: 500 },
      );
    }
  },
);
