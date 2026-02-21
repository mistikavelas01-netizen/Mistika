"use client";

import type { WebhookListParams } from "@/types/webhook";
import type { WebhookEventStatus } from "@/types/webhook";

const TOPIC_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "payment", label: "Pagos" },
  { value: "payments", label: "Payments" },
  { value: "topic_chargebacks_wh", label: "Contracargos" },
  { value: "topic_claims_integration_wh", label: "Reclamos" },
  { value: "stop_delivery_op_wh", label: "Fraude" },
];

const STATUS_OPTIONS: { value: "" | WebhookEventStatus; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "received", label: "Recibido" },
  { value: "processed", label: "Procesado" },
  { value: "failed", label: "Fallido" },
];

export function WebhookFilters({
  params,
  onParamsChange,
  onReset,
}: {
  params: WebhookListParams;
  onParamsChange: (p: WebhookListParams) => void;
  onReset: () => void;
}) {
  const set = (partial: Partial<WebhookListParams>) => onParamsChange({ ...params, ...partial, page: 1 });
  const hasActive = params.status || params.topic || params.q || params.from || params.to;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 bg-white p-4">
      <div className="min-w-[180px]">
        <label className="mb-1 block text-xs font-medium text-black/60">Búsqueda (resourceId / eventId)</label>
        <input
          type="search"
          value={params.q ?? ""}
          onChange={(e) => set({ q: e.target.value || undefined })}
          placeholder="Ej. 12345678"
          className="w-full rounded border border-black/20 px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="min-w-[120px]">
        <label className="mb-1 block text-xs font-medium text-black/60">Estado</label>
        <select
          value={params.status ?? ""}
          onChange={(e) => set({ status: (e.target.value || undefined) as WebhookEventStatus | undefined })}
          className="w-full rounded border border-black/20 px-2.5 py-1.5 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[180px]">
        <label className="mb-1 block text-xs font-medium text-black/60">Topic</label>
        <select value={params.topic ?? ""} onChange={(e) => set({ topic: e.target.value || undefined })} className="w-full rounded border border-black/20 px-2.5 py-1.5 text-sm">
          {TOPIC_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[130px]">
        <label className="mb-1 block text-xs font-medium text-black/60">Desde</label>
        <input type="date" value={params.from ?? ""} onChange={(e) => set({ from: e.target.value || undefined })} className="w-full rounded border border-black/20 px-2.5 py-1.5 text-sm" />
      </div>
      <div className="min-w-[130px]">
        <label className="mb-1 block text-xs font-medium text-black/60">Hasta</label>
        <input type="date" value={params.to ?? ""} onChange={(e) => set({ to: e.target.value || undefined })} className="w-full rounded border border-black/20 px-2.5 py-1.5 text-sm" />
      </div>
      {hasActive && (
        <button type="button" onClick={onReset} className="rounded border border-black/20 px-3 py-1.5 text-sm font-medium text-black/60 hover:bg-black/5">Limpiar filtros</button>
      )}
    </div>
  );
}
