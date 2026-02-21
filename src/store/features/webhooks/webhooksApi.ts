import { apiSlice } from "../api/apiSlice";
import type {
  WebhookEventDTO,
  WebhookListParams,
  WebhookListResponse,
  WebhookDetailResponse,
  WebhookInsightsResponse,
} from "@/types/webhook";

export const webhooksApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listWebhooks: build.query<WebhookListResponse, WebhookListParams | void>({
      query: (params = {}) => {
        const { page = 1, limit = 20, status, topic, q, from, to } = params ?? {};
        const search = new URLSearchParams();
        search.set("page", String(page));
        search.set("limit", String(limit));
        if (status) search.set("status", status);
        if (topic) search.set("topic", topic);
        if (q) search.set("q", q);
        if (from) search.set("from", from);
        if (to) search.set("to", to);
        return `admin/webhooks?${search.toString()}`;
      },
      providesTags: (result) =>
        result ? [...result.items.map((i) => ({ type: "Webhooks" as const, id: i.id })), { type: "Webhooks", id: "LIST" }] : [{ type: "Webhooks", id: "LIST" }],
    }),
    getWebhook: build.query<WebhookEventDTO, string>({
      query: (id) => `admin/webhooks/${id}`,
      transformResponse: (response: WebhookDetailResponse) => response.item,
      providesTags: (_result, _err, id) => [{ type: "Webhooks", id }],
    }),
    retryWebhook: build.mutation<{ success: boolean; message?: string }, string>({
      query: (id) => ({ url: `admin/webhooks/${id}/retry`, method: "POST" }),
      invalidatesTags: (_result, _err, id) => [{ type: "Webhooks", id }, { type: "Webhooks", id: "LIST" }],
    }),
    getWebhookInsights: build.query<WebhookInsightsResponse, { range?: "24h" | "7d" } | void>({
      query: (params = {}) => `admin/webhooks/insights?range=${params?.range ?? "7d"}`,
      providesTags: [{ type: "Webhooks", id: "INSIGHTS" }],
    }),
  }),
});

export const { useListWebhooksQuery, useGetWebhookQuery, useRetryWebhookMutation, useGetWebhookInsightsQuery } = webhooksApi;
