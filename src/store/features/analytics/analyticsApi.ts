import { apiSlice } from "../api/apiSlice";
import type {
  SalesAnalyticsDashboard,
  SalesAnalyticsQueryParams,
  SalesAverageTicketMetric,
  SalesPeriodComparison,
  SalesProductInsight,
  SalesRevenueBreakdownRow,
  SalesTimeBucket,
} from "@/modules/sales-analytics/contracts";

function buildAnalyticsSearchParams(
  params: SalesAnalyticsQueryParams = {},
): string {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.compareFrom) searchParams.set("compareFrom", params.compareFrom);
  if (params.compareTo) searchParams.set("compareTo", params.compareTo);
  if (params.groupBy) searchParams.set("groupBy", params.groupBy);
  if (params.topLimit) searchParams.set("topLimit", String(params.topLimit));
  if (params.revenueLimit) {
    searchParams.set("revenueLimit", String(params.revenueLimit));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function buildRevenueQuery(
  params: SalesAnalyticsQueryParams | void,
  dimension: "product" | "category",
): string {
  const baseSearch = buildAnalyticsSearchParams(params ?? {});
  return `/admin/analytics/revenue${baseSearch}${baseSearch ? "&" : "?"}dimension=${dimension}`;
}

function unwrapItemResponse<T>(response: ApiItemResponse<T>): { data: T } {
  if ("success" in response && response.success && response.data) {
    return { data: response.data };
  }

  if ("data" in response) {
    return { data: response.data };
  }

  return { data: response as T };
}

function unwrapListResponse<T>(response: ApiListResponse<T>): { data: T[] } {
  if (Array.isArray(response)) {
    return { data: response };
  }

  if ("success" in response) {
    if (response.success && response.data) {
      return {
        data: Array.isArray(response.data) ? response.data : [],
      };
    }

    return { data: [] };
  }

  if ("data" in response) {
    return {
      data: Array.isArray(response.data) ? response.data : [],
    };
  }

  return { data: [] };
}

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    fetchSalesAnalyticsDashboard: build.query<
      { data: SalesAnalyticsDashboard },
      SalesAnalyticsQueryParams | void
    >({
      query: (params) => `/admin/analytics/dashboard${buildAnalyticsSearchParams(params ?? {})}`,
      transformResponse: (response: ApiItemResponse<SalesAnalyticsDashboard>) =>
        unwrapItemResponse(response),
      providesTags: ["Analytics"],
    }),

    fetchSalesOverTime: build.query<
      { data: SalesTimeBucket[] },
      SalesAnalyticsQueryParams | void
    >({
      query: (params) => `/admin/analytics/sales${buildAnalyticsSearchParams(params ?? {})}`,
      transformResponse: (response: ApiListResponse<SalesTimeBucket>) =>
        unwrapListResponse(response),
      providesTags: ["Analytics"],
    }),

    fetchTopProducts: build.query<
      { data: SalesProductInsight[] },
      SalesAnalyticsQueryParams | void
    >({
      query: (params) => `/admin/analytics/top-products${buildAnalyticsSearchParams(params ?? {})}`,
      transformResponse: (response: ApiListResponse<SalesProductInsight>) =>
        unwrapListResponse(response),
      providesTags: ["Analytics"],
    }),

    fetchRevenueByProduct: build.query<
      { data: SalesRevenueBreakdownRow[] },
      SalesAnalyticsQueryParams | void
    >({
      query: (params) => buildRevenueQuery(params, "product"),
      transformResponse: (response: ApiListResponse<SalesRevenueBreakdownRow>) =>
        unwrapListResponse(response),
      providesTags: ["Analytics"],
    }),

    fetchRevenueByCategory: build.query<
      { data: SalesRevenueBreakdownRow[] },
      SalesAnalyticsQueryParams | void
    >({
      query: (params) => buildRevenueQuery(params, "category"),
      transformResponse: (response: ApiListResponse<SalesRevenueBreakdownRow>) =>
        unwrapListResponse(response),
      providesTags: ["Analytics"],
    }),

    fetchAverageTicket: build.query<
      { data: SalesAverageTicketMetric },
      SalesAnalyticsQueryParams | void
    >({
      query: (params) => `/admin/analytics/average-ticket${buildAnalyticsSearchParams(params ?? {})}`,
      transformResponse: (response: ApiItemResponse<SalesAverageTicketMetric>) =>
        unwrapItemResponse(response),
      providesTags: ["Analytics"],
    }),

    fetchPeriodComparison: build.query<
      { data: SalesPeriodComparison },
      SalesAnalyticsQueryParams | void
    >({
      query: (params) => `/admin/analytics/comparison${buildAnalyticsSearchParams(params ?? {})}`,
      transformResponse: (response: ApiItemResponse<SalesPeriodComparison>) =>
        unwrapItemResponse(response),
      providesTags: ["Analytics"],
    }),
  }),
});

export const {
  useFetchSalesAnalyticsDashboardQuery,
  useFetchSalesOverTimeQuery,
  useFetchTopProductsQuery,
  useFetchRevenueByProductQuery,
  useFetchRevenueByCategoryQuery,
  useFetchAverageTicketQuery,
  useFetchPeriodComparisonQuery,
} = analyticsApi;
