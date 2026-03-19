import { NextRequest, NextResponse } from "next/server";
import { withApiRoute } from "../../../_utils/with-api-route";
import { logger } from "../../../_utils/logger";
import { getRevenueBreakdown } from "@/modules/sales-analytics/service";
import {
  getAnalyticsErrorResponse,
  getAnalyticsParamsFromRequest,
  requireAnalyticsAdminAuth,
} from "@/modules/sales-analytics/http";

export const GET = withApiRoute(
  { route: "/api/admin/analytics/revenue" },
  async (request: NextRequest) => {
    const auth = await requireAnalyticsAdminAuth(request);
    if (!auth.success) {
      return auth.response;
    }

    const dimension = request.nextUrl.searchParams.get("dimension");
    if (dimension !== "product" && dimension !== "category") {
      return NextResponse.json(
        {
          success: false,
          error: 'El parámetro "dimension" debe ser "product" o "category"',
        },
        { status: 400 },
      );
    }

    try {
      const data = await getRevenueBreakdown(
        getAnalyticsParamsFromRequest(request),
        dimension,
      );

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error) {
      const handledResponse = getAnalyticsErrorResponse(error);
      if (handledResponse) {
        return handledResponse;
      }

      logger.error("analytics.revenue_failed", { error, dimension });
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo obtener el desglose de ingresos",
        },
        { status: 500 },
      );
    }
  },
);
