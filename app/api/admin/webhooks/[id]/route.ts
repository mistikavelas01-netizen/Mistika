import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { webhookEventsRepo } from "../../../_utils/repos";
import { sanitizeWebhookPayload } from "@/lib/webhooks/sanitize-payload";
import type { WebhookEventDTO, WebhookDetailResponse } from "@/types/webhook";
import type { WebhookEventEntity } from "@/firebase/repos";
import { logger } from "../../../_utils/logger";
import { withApiRoute } from "../../../_utils/with-api-route";

function toDTO(e: WebhookEventEntity & { _id: string }, sanitizeRaw: boolean): WebhookEventDTO {
  const createdAt = typeof e.createdAt === "number" ? e.createdAt : 0;
  const updatedAt = typeof e.updatedAt === "number" ? e.updatedAt : 0;
  const processedAt = e.processedAt != null && typeof e.processedAt === "number" ? e.processedAt : null;
  const raw = e.rawPayloadTruncated;
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
    rawPayloadTruncated: raw ? (sanitizeRaw ? sanitizeWebhookPayload(raw) : raw) : null,
    processedAt: processedAt != null ? new Date(processedAt).toISOString() : null,
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(updatedAt).toISOString(),
  };
}

export const GET = withApiRoute(
  { route: "/api/admin/webhooks/[id]" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const doc = await webhookEventsRepo.getById(id);
    if (!doc) return NextResponse.json({ error: "Webhook event not found" }, { status: 404 });
    const item = toDTO(doc as WebhookEventEntity & { _id: string }, true);
    return NextResponse.json({ item } satisfies WebhookDetailResponse);
  } catch (err) {
    logger.error("admin.webhooks_get_failed", { error: err });
    return NextResponse.json({ error: "Error fetching webhook event" }, { status: 500 });
  }
});
