import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/api-helper";
import { webhookEventsRepo } from "../../../../_utils/repos";
import { processWebhookEventByTopic } from "@/services/processWebhookEvent";
import { logger } from "../../../../_utils/logger";
import { withApiRoute } from "../../../../_utils/with-api-route";

export const POST = withApiRoute(
  { route: "/api/admin/webhooks/[id]/retry" },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireAdminAuth(request);
  if (!auth.success) return auth.response;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const doc = await webhookEventsRepo.getById(id);
    if (!doc) return NextResponse.json({ error: "Webhook event not found" }, { status: 404 });
    if (doc.status !== "failed") {
      return NextResponse.json({ error: "Only failed events can be retried", status: doc.status }, { status: 400 });
    }
    const result = await processWebhookEventByTopic({
      eventId: id,
      topic: String(doc.topic),
      resourceId: String(doc.resourceId),
    });
    if (result.success) return NextResponse.json({ success: true, message: "Event reprocessed" });
    return NextResponse.json({ success: false, error: result.error }, { status: 422 });
  } catch (err) {
    logger.error("admin.webhooks_retry_failed", { error: err });
    return NextResponse.json({ error: "Error retrying webhook event" }, { status: 500 });
  }
});
