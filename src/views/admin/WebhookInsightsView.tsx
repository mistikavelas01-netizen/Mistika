"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useGetWebhookInsightsQuery } from "@/store/features/webhooks/webhooksApi";
import { StatusBadge } from "@/components/admin/webhooks/StatusBadge";
import { ServerError } from "@/components/ui/ServerError";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function WebhookInsightsView() {
  const [range, setRange] = useState<"24h" | "7d">("7d");
  const { data, isLoading, isError, refetch } = useGetWebhookInsightsQuery({ range });

  if (isError) return <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5"><div className="mx-auto max-w-4xl px-4 py-8"><ServerError message="No se pudieron cargar los insights" onRetry={() => refetch()} /></div></main>;

  const byStatus = data?.byStatus ?? [];
  const byTopic = data?.byTopic ?? [];
  const failedCount = data?.failedCount ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const failedPercentage = data?.failedPercentage ?? 0;
  const recentFailed = data?.recentFailed ?? [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/webhooks" className="inline-flex items-center gap-1.5 text-sm font-medium text-black/60 hover:text-black/80">
          <ArrowLeft className="h-4 w-4" /> Volver a Webhooks
        </Link>
        <h1 className="mt-6 flex items-center gap-2 text-xl font-semibold text-black/90">
          <BarChart3 className="h-5 w-5" /> Insights
        </h1>
        <div className="mb-4 mt-4 flex gap-2">
          <button type="button" onClick={() => setRange("24h")} className={`rounded border px-3 py-1.5 text-sm font-medium ${range === "24h" ? "border-black/30 bg-black/5 text-black/90" : "border-black/15 text-black/60 hover:bg-black/5"}`}>Últimas 24 h</button>
          <button type="button" onClick={() => setRange("7d")} className={`rounded border px-3 py-1.5 text-sm font-medium ${range === "7d" ? "border-black/30 bg-black/5 text-black/90" : "border-black/15 text-black/60 hover:bg-black/5"}`}>Últimos 7 días</button>
        </div>
        {isLoading ? <p className="text-black/50">Cargando…</p> : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-black/10 bg-white p-4"><p className="text-xs font-medium text-black/50">Total eventos</p><p className="text-2xl font-semibold text-black/90">{totalCount}</p></div>
              <div className="rounded-lg border border-black/10 bg-white p-4"><p className="text-xs font-medium text-black/50">Fallidos</p><p className="text-2xl font-semibold text-red-600">{failedCount}</p></div>
              <div className="rounded-lg border border-black/10 bg-white p-4"><p className="text-xs font-medium text-black/50">% fallidos</p><p className="text-2xl font-semibold text-black/90">{failedPercentage}%</p></div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-black/10 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-black/80">Por estado</h3>
                <ul className="space-y-2">{byStatus.map((s) => <li key={s.status} className="flex items-center justify-between text-sm"><StatusBadge status={s.status} /><span className="font-medium text-black/80">{s.count}</span></li>)}</ul>
              </div>
              <div className="rounded-lg border border-black/10 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-black/80">Top topics</h3>
                <ul className="space-y-2">{byTopic.slice(0, 10).map((t) => <li key={t.topic} className="flex items-center justify-between text-sm"><span className="max-w-[200px] truncate text-black/80">{t.topic || "(vacío)"}</span><span className="font-medium text-black/80">{t.count}</span></li>)}</ul>
              </div>
            </div>
            <div className="rounded-lg border border-black/10 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-black/80">Últimos 20 fallidos</h3>
              {recentFailed.length === 0 ? <p className="text-sm text-black/50">Ningún fallo en el rango</p> : (
                <ul className="space-y-2">{recentFailed.map((e) => <li key={e.id} className="flex items-center gap-3 text-sm"><span className="text-black/50">{formatDate(e.createdAt)}</span><span className="max-w-[120px] truncate font-mono text-black/70">{e.resourceId}</span><span className="max-w-[160px] truncate text-black/60">{e.topic}</span><Link href={`/admin/webhooks/${e.id}`} className="font-medium text-black/70 hover:underline">Ver</Link></li>)}</ul>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
