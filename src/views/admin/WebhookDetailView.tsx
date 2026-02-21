"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useGetWebhookQuery } from "@/store/features/webhooks/webhooksApi";
import { StatusBadge } from "@/components/admin/webhooks/StatusBadge";
import { JsonViewer } from "@/components/admin/webhooks/JsonViewer";
import { RetryButton } from "@/components/admin/webhooks/RetryButton";
import { ServerError } from "@/components/ui/ServerError";
import { useRetryWebhookMutation } from "@/store/features/webhooks/webhooksApi";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "medium" });
  } catch {
    return iso;
  }
}

export function WebhookDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: item, isLoading, isError, refetch } = useGetWebhookQuery(id);
  const [retryMutation] = useRetryWebhookMutation();

  const handleRetry = async (eventId: string) => {
    try {
      const result = await retryMutation(eventId).unwrap();
      return { success: result.success };
    } catch (e: unknown) {
      const err = e as { data?: { error?: string } };
      return { success: false, error: err?.data?.error ?? "Error al reintentar" };
    }
  };

  if (isLoading) return <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5"><div className="mx-auto max-w-4xl px-4 py-8"><p className="text-black/50">Cargando evento…</p></div></main>;
  if (isError || !item) return <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5"><div className="mx-auto max-w-4xl px-4 py-8"><ServerError message="No se pudo cargar el evento" onRetry={() => refetch()} /></div></main>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/webhooks" className="inline-flex items-center gap-1.5 text-sm font-medium text-black/60 hover:text-black/80">
          <ArrowLeft className="h-4 w-4" /> Volver a Webhooks
        </Link>
        <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-black/90">Evento {item.eventId}</h1>
          <StatusBadge status={item.status} />
        </div>
        <section className="mb-6 rounded-lg border border-black/10 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-black/80">Metadatos</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-black/50">ID</dt><dd className="font-mono text-black/80">{item.id}</dd></div>
            <div><dt className="text-black/50">Provider</dt><dd>{item.provider}</dd></div>
            <div><dt className="text-black/50">Event ID</dt><dd className="font-mono text-black/80">{item.eventId}</dd></div>
            <div><dt className="text-black/50">Topic</dt><dd>{item.topic}</dd></div>
            <div><dt className="text-black/50">Action</dt><dd>{item.action}</dd></div>
            <div><dt className="text-black/50">Resource ID</dt><dd className="font-mono text-black/80">{item.resourceId}</dd></div>
            <div><dt className="text-black/50">Estado</dt><dd><StatusBadge status={item.status} /></dd></div>
            <div><dt className="text-black/50">Reintentos</dt><dd>{item.retryCount}</dd></div>
            <div><dt className="text-black/50">Creado</dt><dd>{formatDate(item.createdAt)}</dd></div>
            <div><dt className="text-black/50">Procesado</dt><dd>{item.processedAt ? formatDate(item.processedAt) : "—"}</dd></div>
            {item.lastError && <div className="sm:col-span-2"><dt className="text-black/50">Último error</dt><dd className="mt-1 rounded bg-red-50 p-2 font-mono text-xs text-red-800">{item.lastError}</dd></div>}
          </dl>
        </section>
        <section className="mb-6 rounded-lg border border-black/10 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-black/80">Acciones</h2>
          <div className="flex flex-wrap gap-2">
            {item.status === "failed" && <RetryButton eventId={item.id} onRetry={handleRetry} onSuccess={() => { refetch(); router.refresh(); }} />}
          </div>
        </section>
        {item.rawPayloadTruncated && (
          <section className="rounded-lg border border-black/10 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-black/80">Payload (sanitizado)</h2>
            <JsonViewer content={item.rawPayloadTruncated} />
          </section>
        )}
      </div>
    </main>
  );
}
