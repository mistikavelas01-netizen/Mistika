"use client";

import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";

/**
 * Página de retorno desde Mercado Pago (back_urls).
 * Recibe draftId; cuando el webhook crea la orden, mostramos el enlace al pedido.
 */
function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const pathSegment = (params?.status as string[] | undefined)?.[0] ?? "";
  const status =
    searchParams.get("status") ??
    searchParams.get("payment_status") ??
    searchParams.get("collection_status") ??
    pathSegment ??
    "unknown";
  const draftId = searchParams.get("draftId") ?? "";
  const orderNumberLegacy = searchParams.get("orderNumber") ?? "";

  const [orderNumber, setOrderNumber] = useState<string | null>(orderNumberLegacy || null);
  const [isPolling, setIsPolling] = useState(false);

  const isSuccess = status === "success" || status === "approved";
  const isFailure = status === "failure" || status === "rejected";
  const isPending = status === "pending" || status === "in_process" || status === "in_mediation";

  useEffect(() => {
    if (!draftId || !isSuccess || orderNumber) return;
    let cancelled = false;
    const poll = async () => {
      setIsPolling(true);
      for (let i = 0; i < 30 && !cancelled; i++) {
        try {
          const res = await fetch(`/api/checkout/draft/${draftId}/status`);
          const json = await res.json();
          if (json.success && json.data?.status === "converted" && json.data?.orderNumber) {
            setOrderNumber(json.data.orderNumber);
            return;
          }
        } catch {
          /* ignore */
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      setIsPolling(false);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [draftId, isSuccess, orderNumber]);

  const config = isSuccess
    ? {
        icon: CheckCircle,
        title: "¡Pago aprobado!",
        description: orderNumber
          ? "Tu pedido fue creado correctamente."
          : isPolling
            ? "Procesando tu pedido..."
            : "Tu pago se procesó correctamente. La orden se creará en unos segundos.",
        className: "text-green-700 bg-green-50 border-green-200",
        iconClassName: "text-green-600",
      }
    : isFailure
      ? {
          icon: XCircle,
          title: "Pago rechazado o cancelado",
          description: "El pago no se completó. Puedes intentar de nuevo desde el carrito.",
          className: "text-red-700 bg-red-50 border-red-200",
          iconClassName: "text-red-600",
        }
      : isPending
        ? {
            icon: Clock,
            title: "Pago pendiente",
            description:
              "Tu pago está siendo procesado (ej. OXXO, transferencia). Te notificaremos cuando se confirme.",
            className: "text-amber-700 bg-amber-50 border-amber-200",
            iconClassName: "text-amber-600",
          }
        : {
            icon: Clock,
            title: "Volviendo de Mercado Pago",
            description: "Consulta el estado de tu pedido.",
            className: "text-neutral-700 bg-neutral-50 border-neutral-200",
            iconClassName: "text-neutral-600",
          };

  const Icon = config.icon;
  const displayOrderNumber = orderNumber ?? orderNumberLegacy;
  const orderLink = displayOrderNumber ? `/orders/${displayOrderNumber}` : "/";

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-12">
        <div
          className={`w-full rounded-[32px] border p-8 shadow-[0_16px_36px_rgba(0,0,0,0.08)] ${config.className}`}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full ${config.iconClassName} bg-current/10`}
            >
              <Icon size={32} aria-hidden="true" />
            </div>
            <h1 className="mb-3 text-2xl font-semibold">{config.title}</h1>
            <p className="mb-6 text-sm opacity-90">{config.description}</p>
            <Link
              href={orderLink}
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-black/90"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              {displayOrderNumber ? `Ver pedido ${displayOrderNumber}` : "Volver al inicio"}
            </Link>
          </div>
        </div>
        {isSuccess && draftId && !displayOrderNumber && (
          <p className="mt-6 text-center text-xs text-black/50">
            Esperando confirmación del pago... Si tarda mucho, recarga la página.
          </p>
        )}
      </div>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
        </main>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
