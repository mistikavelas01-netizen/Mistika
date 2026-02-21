import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { webhookEventsRepo } from "../../../_utils/repos";
import type { WebhookEventDTO, WebhookInsightsResponse } from "@/types/webhook";
import type { WebhookEventEntity } from "@/firebase/repos";
import { logger } from "../../../_utils/logger";
import { withApiRoute } from "../../../_utils/with-api-route";

const querySchema = z.object({ range: z.enum(["24h", "7d"]).default("7d") });

function toDTO(e: WebhookEventEntity & { _id: string }): WebhookEventDTO {
  const createdAt = typeof e.createdAt === "number" ? e.createdAt : 0;
  const updatedAt = typeof e.updatedAt === "number" ? e.updatedAt : 0;
  const processedAt = e.processedAt != null && typeof e.processedAt === "number" ? e.processedAt : null;
  return {
    id: e._id,
    provider: e.provider ?? "",
    eventId: e.eventId ?? "",
    topic: e.topic ?? "",
    action: e.action ?? "",
    resourceId: e.resourceId ?? "",
    actionCreatedAtBucket: e.actionCreatedAtBucket ?? null,
    status: (e.status as WebhookEventDTO["status"]) ?? "received",
    retryCount: e.retryCount ?? 0,
    lastError: e.lastError ?? null,
    rawPayloadTruncated: undefined,
    processedAt: processedAt != null ? new Date(processedAt).toISOString() : null,
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(updatedAt).toISOString(),
  };
}

export const GET = withApiRoute({ route: "/api/admin/webhooks/insights" }, async (request: NextRequest) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  const range = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams)).success
    ? querySchema.parse(Object.fromEntries(request.nextUrl.searchParams)).range
    : "7d";
  try {
    const all = await webhookEventsRepo.where("provider" as keyof WebhookEventEntity, "==", "mercadopago");
    const fromTs = range === "24h" ? Date.now() - 24 * 60 * 60 * 1000 : Date.now() - 7 * 24 * 60 * 60 * 1000;
    const list = (all as (WebhookEventEntity & { _id: string })[]).filter((e) => (e.createdAt as number) >= fromTs);
    const byStatus = new Map<string, number>();
    const byTopic = new Map<string, number>();
    let failedCount = 0;
    for (const e of list) {
      byStatus.set(e.status, (byStatus.get(e.status) ?? 0) + 1);
      byTopic.set(e.topic ?? "", (byTopic.get(e.topic ?? "") ?? 0) + 1);
      if (e.status === "failed") failedCount++;
    }
    const totalCount = list.length;
    const failedPercentage = totalCount > 0 ? Math.round((failedCount / totalCount) * 100) : 0;
    const recentFailed = list
      .filter((e) => e.status === "failed")
      .sort((a, b) => (b.updatedAt as number) - (a.updatedAt as number))
      .slice(0, 20)
      .map(toDTO);
    const response: WebhookInsightsResponse = {
      byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({ status: status as WebhookEventDTO["status"], count })),
      byTopic: Array.from(byTopic.entries()).map(([topic, count]) => ({ topic, count })),
      failedCount,
      totalCount,
      failedPercentage,
      recentFailed,
    };
    return NextResponse.json(response);
  } catch (err) {
    logger.error("admin.webhooks_insights_failed", { error: err });
    return NextResponse.json({ error: "Error fetching insights" }, { status: 500 });
  }
});
