"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Webhook } from "lucide-react";
import { useListWebhooksQuery } from "@/store/features/webhooks/webhooksApi";
import { WebhookFilters } from "@/components/admin/webhooks/WebhookFilters";
import { WebhookEventsTable } from "@/components/admin/webhooks/WebhookEventsTable";
import { ServerError } from "@/components/ui/ServerError";
import type { WebhookListParams } from "@/types/webhook";

const defaultParams: WebhookListParams = { page: 1, limit: 20 };

export function WebhooksAdminView() {
  const [params, setParams] = useState<WebhookListParams>(defaultParams);
  const { data, isLoading, isError, refetch } = useListWebhooksQuery(params);
  const handleParamsChange = useCallback((p: WebhookListParams) => setParams(p), []);
  const handleReset = useCallback(() => setParams(defaultParams), []);
  const handleCopyId = useCallback((id: string) => navigator.clipboard.writeText(id).catch(() => {}), []);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const limit = data?.limit ?? 20;
  const totalPages = data?.totalPages ?? 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-black/60 hover:text-black/80">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Link>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-black/90">
              <Webhook className="h-5 w-5" /> Webhooks (auditoría)
            </h1>
          </div>
          <Link href="/admin/webhooks/insights" className="rounded border border-black/15 px-3 py-1.5 text-sm font-medium text-black/70 hover:bg-black/5">
            Ver insights
          </Link>
        </div>
        <div className="space-y-4">
          <WebhookFilters params={params} onParamsChange={handleParamsChange} onReset={handleReset} />
          {isError && <ServerError message="No se pudieron cargar los eventos" onRetry={() => refetch()} />}
          {isLoading && (
            <div className="flex justify-center rounded-lg border border-black/10 bg-white py-12">
              <span className="text-sm text-black/50">Cargando…</span>
            </div>
          )}
          {!isLoading && !isError && (
            <WebhookEventsTable
              items={items}
              total={total}
              page={page}
              limit={limit}
              totalPages={totalPages}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
              onCopyId={handleCopyId}
            />
          )}
        </div>
      </div>
    </main>
  );
}
