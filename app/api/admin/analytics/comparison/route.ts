import { NextRequest, NextResponse } from "next/server";
import { withApiRoute } from "../../../_utils/with-api-route";
import { logger } from "../../../_utils/logger";
import { getPeriodComparison } from "@/modules/sales-analytics/service";
import {
  getAnalyticsErrorResponse,
  getAnalyticsParamsFromRequest,
  requireAnalyticsAdminAuth,
} from "@/modules/sales-analytics/http";

export const GET = withApiRoute(
  { route: "/api/admin/analytics/comparison" },
  async (request: NextRequest) => {
    const auth = await requireAnalyticsAdminAuth(request);
    if (!auth.success) {
      return auth.response;
    }

    try {
      const data = await getPeriodComparison(
        getAnalyticsParamsFromRequest(request),
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

      logger.error("analytics.comparison_failed", { error });
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo comparar el periodo seleccionado",
        },
        { status: 500 },
      );
    }
  },
);
