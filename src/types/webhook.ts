export type WebhookEventStatus = "received" | "processed" | "failed";

export interface WebhookEventDTO {
  id: string;
  provider: string;
  eventId: string;
  topic: string;
  action: string;
  resourceId: string;
  actionCreatedAtBucket?: string | null;
  status: WebhookEventStatus;
  retryCount: number;
  lastError?: string | null;
  rawPayloadTruncated?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookListParams {
  page?: number;
  limit?: number;
  status?: WebhookEventStatus;
  topic?: string;
  q?: string;
  from?: string;
  to?: string;
}

export interface WebhookListResponse {
  items: WebhookEventDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WebhookDetailResponse {
  item: WebhookEventDTO;
}

export interface WebhookInsightsResponse {
  byStatus: { status: WebhookEventStatus; count: number }[];
  byTopic: { topic: string; count: number }[];
  failedCount: number;
  totalCount: number;
  failedPercentage: number;
  recentFailed: WebhookEventDTO[];
}
