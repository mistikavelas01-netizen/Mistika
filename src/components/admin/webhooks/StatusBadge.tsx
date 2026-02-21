"use client";

import type { WebhookEventStatus } from "@/types/webhook";

const statusConfig: Record<WebhookEventStatus, { label: string; className: string }> = {
  received: { label: "Recibido", className: "bg-slate-100 text-slate-700 border-slate-200" },
  processed: { label: "Procesado", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed: { label: "Fallido", className: "bg-red-50 text-red-700 border-red-200" },
};

export function StatusBadge({ status, className = "" }: { status: WebhookEventStatus; className?: string }) {
  const config = statusConfig[status] ?? statusConfig.received;
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}
