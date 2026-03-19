import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import {
  SalesAnalyticsInputError,
  getSalesAnalyticsParamsFromSearchParams,
} from "./service";
import type { SalesAnalyticsQueryParams } from "./contracts";

export async function requireAnalyticsAdminAuth(request: NextRequest) {
  return requireAdminAuth(request);
}

export function getAnalyticsParamsFromRequest(
  request: NextRequest,
): SalesAnalyticsQueryParams {
  return getSalesAnalyticsParamsFromSearchParams(request.nextUrl.searchParams);
}

export function getAnalyticsErrorResponse(error: unknown) {
  if (error instanceof SalesAnalyticsInputError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 },
    );
  }

  return null;
}
