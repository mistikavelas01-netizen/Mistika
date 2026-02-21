"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

export function RetryButton({
  eventId,
  onRetry,
  onSuccess,
  disabled = false,
}: {
  eventId: string;
  onRetry: (id: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await onRetry(eventId);
      if (result.success) {
        setOpen(false);
        onSuccess?.();
      } else setError(result.error ?? "Error al reintentar");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al reintentar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled || loading}
        className="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reintentar
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-black/10 bg-white p-4 shadow-lg">
            <h3 className="font-semibold text-black/90">Reintentar procesamiento</h3>
            <p className="mt-2 text-sm text-black/60">Se volverá a ejecutar la lógica del webhook. ¿Continuar?</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setOpen(false); setError(null); }} className="rounded border border-black/20 px-3 py-1.5 text-sm font-medium text-black/70 hover:bg-black/5">Cancelar</button>
              <button type="button" onClick={handleRetry} disabled={loading} className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">{loading ? "Procesando…" : "Reintentar"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
