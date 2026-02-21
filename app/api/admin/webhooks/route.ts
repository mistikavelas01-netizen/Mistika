import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { webhookEventsRepo } from "../../_utils/repos";
import type { WebhookEventDTO, WebhookListResponse } from "@/types/webhook";
import type { WebhookEventEntity } from "@/firebase/repos";
import { logger } from "../../_utils/logger";
import { withApiRoute } from "../../_utils/with-api-route";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["received", "processed", "failed"]).optional(),
  topic: z.string().max(100).optional(),
  q: z.string().max(200).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

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

export const GET = withApiRoute({ route: "/api/admin/webhooks" }, async (request: NextRequest) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  const parseResult = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const { page, limit, status, topic, q, from, to } = parseResult.success ? parseResult.data : { page: 1, limit: 20, status: undefined, topic: undefined, q: undefined, from: undefined, to: undefined };

  try {
    const all = await webhookEventsRepo.where("provider" as keyof WebhookEventEntity, "==", "mercadopago");
    let list = all as (WebhookEventEntity & { _id: string })[];
    if (status) list = list.filter((e) => e.status === status);
    if (topic) list = list.filter((e) => e.topic === topic);
    if (from) {
      const fromMs = from.length === 10 ? new Date(from + "T00:00:00.000Z").getTime() : new Date(from).getTime();
      list = list.filter((e) => (e.createdAt as number) >= fromMs);
    }
    if (to) {
      const toMs = to.length === 10 ? new Date(to + "T23:59:59.999Z").getTime() : new Date(to).getTime();
      list = list.filter((e) => (e.createdAt as number) <= toMs);
    }
    if (q?.trim()) {
      const qTrim = q.trim().toLowerCase();
      list = list.filter((e) => (e.resourceId ?? "").toLowerCase().includes(qTrim) || (e.eventId ?? "").toLowerCase().includes(qTrim));
    }
    list.sort((a, b) => ((b.createdAt as number) ?? 0) - ((a.createdAt as number) ?? 0));
    const total = list.length;
    const skip = (page - 1) * limit;
    const items = list.slice(skip, skip + limit).map(toDTO);
    const response: WebhookListResponse = { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    return NextResponse.json(response);
  } catch (err) {
    logger.error("admin.webhooks_list_failed", { error: err });
    return NextResponse.json({ error: "Error fetching webhook events" }, { status: 500 });
  }
});
