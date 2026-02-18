"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState, useRef } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";

const VERIFY_TIMEOUT_MS = 12000;

type VerifyResult = {
  success: boolean;
  orderId: string | null;
  orderNumber: string | null;
  status: string;
  detail?: string;
  canRetry: boolean;
  nextAction: string;
  error?: string;
};

function CheckoutReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [state, setState] = useState<"loading" | "done" | "timeout" | "error">("loading");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const clearedCartRef = useRef(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    const paymentId = searchParams.get("payment_id") ?? searchParams.get("collection_id") ?? "";
    const preferenceId = searchParams.get("preference_id") ?? "";
    const merchantOrderId = searchParams.get("merchant_order_id") ?? "";

    if (!paymentId && !preferenceId) {
      setResult({
        success: false,
        orderId: null,
        orderNumber: null,
        status: "unknown",
        detail: "No se recibieron datos de retorno de Mercado Pago.",
        canRetry: true,
        nextAction: "retry_checkout",
      });
      setState("done");
      return;
    }

    const params = new URLSearchParams();
    if (paymentId) params.set("payment_id", paymentId);
    if (preferenceId) params.set("preference_id", preferenceId);
    if (merchantOrderId) params.set("merchant_order_id", merchantOrderId);

    const timeoutId = setTimeout(() => {
      setState((prev) => {
        if (prev !== "loading") return prev;
        return "timeout";
      });
    }, VERIFY_TIMEOUT_MS);

    fetch(`/api/payments/mercadopago/verify?${params.toString()}`)
      .then((res) => res.json())
      .then((data: VerifyResult & { error?: string }) => {
        clearTimeout(timeoutId);
        setResult({
          success: data.success ?? false,
          orderId: data.orderId ?? null,
          orderNumber: data.orderNumber ?? null,
          status: data.status ?? "unknown",
          detail: data.detail ?? data.error,
          canRetry: data.canRetry ?? false,
          nextAction: data.nextAction ?? "retry_checkout",
          error: data.error,
        });
        setState("done");
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setResult({
          success: false,
          orderId: null,
          orderNumber: null,
          status: "unknown",
          detail: "Error al verificar el pago.",
          canRetry: true,
          nextAction: "retry_checkout",
        });
        setState("error");
      });

    return () => clearTimeout(timeoutId);
  }, [searchParams]);

  // Vaciar carrito solo cuando el backend confirma APPROVED (una sola vez)
  useEffect(() => {
    if (state !== "done" || !result || result.status !== "APPROVED" || clearedCartRef.current) return;
    clearedCartRef.current = true;
    clearCart();
  }, [state, result, clearCart]);

  // Redirigir directo a los detalles del pedido cuando el pago está aprobado y tenemos orderNumber
  useEffect(() => {
    if (
      state !== "done" ||
      !result ||
      result.status !== "APPROVED" ||
      !result.orderNumber ||
      redirectedRef.current
    )
      return;
    redirectedRef.current = true;
    router.replace(`/orders/${result.orderNumber}`);
  }, [state, result, router]);

  if (state === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Loader2 size={48} className="animate-spin text-blue-600" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-black/70">Verificando tu pago…</p>
        <p className="mt-1 text-xs text-black/50">No cierres esta ventana</p>
      </main>
    );
  }

  if (state === "timeout") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5 px-4 py-12">
        <div className="mx-auto max-w-lg">
          <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-8 text-amber-800 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <AlertCircle size={48} className="mb-4 text-amber-600" aria-hidden="true" />
              <h1 className="text-xl font-semibold">La verificación está tardando</h1>
              <p className="mt-2 text-sm opacity-90">
                Tu pago puede haberse procesado. Revisa tu correo o la sección &quot;Mis pedidos&quot; en unos minutos.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800"
                >
                  Ir a mis pedidos
                </Link>
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
                >
                  Volver al carrito
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const r = result!;
  const isApproved = r.status === "APPROVED";
  const isPending = r.status === "PENDING";
  const isFailed =
    r.status === "REJECTED" ||
    r.status === "CANCELLED" ||
    r.status === "EXPIRED" ||
    r.status === "FAILED";

  // Aprobado con orderNumber: redirigiendo; misma tarjeta que el resto para no parecer overlay
  if (isApproved && r.orderNumber) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5 px-4 py-12">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center">
          <div className="w-full rounded-[32px] border border-green-200 bg-green-50 p-8 text-green-700 shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col items-center text-center">
              <Loader2 size={40} className="animate-spin text-green-600" aria-hidden="true" />
              <p className="mt-4 text-sm font-medium">Redirigiendo a tu pedido…</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const config = isApproved
    ? {
        icon: CheckCircle,
        title: "¡Pago aprobado!",
        description: r.detail ?? "Tu pedido fue confirmado correctamente.",
        className: "text-green-700 bg-green-50 border-green-200",
        iconClassName: "text-green-600",
      }
    : isPending
      ? {
          icon: Clock,
          title: "Pago pendiente",
          description:
            r.detail ??
            "Tu pago está siendo procesado (ej. OXXO, transferencia). Te notificaremos cuando se confirme.",
          className: "text-amber-700 bg-amber-50 border-amber-200",
          iconClassName: "text-amber-600",
        }
      : isFailed
        ? {
            icon: XCircle,
            title: "Pago no completado",
            description: r.detail ?? "El pago fue rechazado o cancelado. Puedes intentar de nuevo.",
            className: "text-red-700 bg-red-50 border-red-200",
            iconClassName: "text-red-600",
          }
        : {
            icon: AlertCircle,
            title: "Estado del pago",
            description: r.detail ?? "Consulta el estado de tu pedido.",
            className: "text-neutral-700 bg-neutral-50 border-neutral-200",
            iconClassName: "text-neutral-600",
          };

  const Icon = config.icon;
  const orderLink = r.orderNumber ? `/orders/${r.orderNumber}` : "/";

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5 px-4 py-12">
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center">
        <div
          className={`w-full rounded-[32px] border p-8 shadow-[0_16px_36px_rgba(0,0,0,0.08)] ${config.className}`}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-current/10 ${config.iconClassName}`}
            >
              <Icon size={32} aria-hidden="true" />
            </div>
            <h1 className="mb-3 text-2xl font-semibold">{config.title}</h1>
            <p className="mb-6 text-sm opacity-90">{config.description}</p>
            <div className="flex flex-wrap justify-center gap-3">
              {isApproved && (
                <Link
                  href={orderLink}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-black/90"
                >
                  {r.orderNumber ? `Ver pedido ${r.orderNumber}` : "Volver al inicio"}
                </Link>
              )}
              {isPending && (
                <>
                  <Link
                    href="/orders"
                    className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                  >
                    Revisar estado
                  </Link>
                  <Link
                    href="/cart"
                    className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
                  >
                    Volver al carrito
                  </Link>
                </>
              )}
              {(isFailed || (!isApproved && !isPending && r.canRetry)) && (
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <ShoppingBag size={18} />
                  Reintentar pago
                </Link>
              )}
              {!isApproved && !isPending && !r.canRetry && (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/90"
                >
                  Volver al inicio
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
        </main>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  );
}
