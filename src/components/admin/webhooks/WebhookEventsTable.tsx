"use client";

import Link from "next/link";
import { Eye, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { RetryButton } from "./RetryButton";
import type { WebhookEventDTO } from "@/types/webhook";
import { useRetryWebhookMutation } from "@/store/features/webhooks/webhooksApi";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function WebhookEventsTable({
  items,
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onCopyId,
}: {
  items: WebhookEventDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onCopyId: (id: string) => void;
}) {
  const [retryMutation] = useRetryWebhookMutation();
  const handleRetry = async (id: string) => {
    try {
      const result = await retryMutation(id).unwrap();
      return { success: result.success };
    } catch (e: unknown) {
      const err = e as { data?: { error?: string } };
      return { success: false, error: err?.data?.error ?? "Error al reintentar" };
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-black/10 bg-white p-8 text-center text-black/60">
        No hay eventos que coincidan con los filtros.
      </div>
    );
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/[0.02]">
              <th className="px-4 py-3 font-medium text-black/70">Fecha</th>
              <th className="px-4 py-3 font-medium text-black/70">Provider</th>
              <th className="px-4 py-3 font-medium text-black/70">Topic</th>
              <th className="px-4 py-3 font-medium text-black/70">Action</th>
              <th className="px-4 py-3 font-medium text-black/70">Resource ID</th>
              <th className="px-4 py-3 font-medium text-black/70">Estado</th>
              <th className="px-4 py-3 font-medium text-black/70">Reintentos</th>
              <th className="px-4 py-3 font-medium text-black/70">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                <td className="whitespace-nowrap px-4 py-2.5 text-black/80">{formatDate(item.createdAt)}</td>
                <td className="px-4 py-2.5 text-black/70">{item.provider}</td>
                <td className="max-w-[140px] truncate px-4 py-2.5 text-black/70" title={item.topic}>{item.topic}</td>
                <td className="max-w-[120px] truncate px-4 py-2.5 text-black/70" title={item.action}>{item.action}</td>
                <td className="max-w-[120px] truncate px-4 py-2.5 font-mono text-xs text-black/80" title={item.resourceId}>{item.resourceId}</td>
                <td className="px-4 py-2.5"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-2.5 text-black/70">{item.retryCount}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/webhooks/${item.id}`} className="inline-flex items-center gap-1 rounded border border-black/15 px-2 py-1 text-xs font-medium text-black/70 hover:bg-black/5">
                      <Eye className="h-3.5 w-3.5" /> Ver
                    </Link>
                    <button type="button" onClick={() => onCopyId(item.id)} className="inline-flex items-center gap-1 rounded border border-black/15 px-2 py-1 text-xs font-medium text-black/70 hover:bg-black/5" title="Copiar ID">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {item.status === "failed" && <RetryButton eventId={item.id} onRetry={handleRetry} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-black/10 px-4 py-3">
          <p className="text-xs text-black/60">{start}–{end} de {total}</p>
          <div className="flex gap-1">
            <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="rounded border border-black/15 p-1.5 text-black/70 hover:bg-black/5 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex items-center px-2 text-sm text-black/70">Página {page} de {totalPages}</span>
            <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="rounded border border-black/15 p-1.5 text-black/70 hover:bg-black/5 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
