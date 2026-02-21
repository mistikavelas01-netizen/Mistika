"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useCart } from "@/context/cart-context";

const VERIFY_TIMEOUT_MS = 12000;
const TOAST_KEY = "checkout_return_toast";

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

function setReturnToast(type: "error" | "info", message: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(TOAST_KEY, JSON.stringify({ type, message }));
  } catch {
    /* ignore */
  }
}

function CheckoutReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
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
      return;
    }

    const params = new URLSearchParams();
    if (paymentId) params.set("payment_id", paymentId);
    if (preferenceId) params.set("preference_id", preferenceId);
    if (merchantOrderId) params.set("merchant_order_id", merchantOrderId);

    const timeoutId = setTimeout(() => {
      setResult({
        success: false,
        orderId: null,
        orderNumber: null,
        status: "timeout",
        detail: "No se pudo verificar el pago. Revisa tu carrito o intenta de nuevo.",
        canRetry: true,
        nextAction: "retry_checkout",
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
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setResult({
          success: false,
          orderId: null,
          orderNumber: null,
          status: "unknown",
          detail: "Error al verificar el pago. Intenta de nuevo.",
          canRetry: true,
          nextAction: "retry_checkout",
        });
      });

    return () => clearTimeout(timeoutId);
  }, [searchParams]);

  // Una sola pantalla de carga; al tener resultado redirigir de inmediato (sin vistas intermedias)
  useEffect(() => {
    if (!result || redirectedRef.current) return;

    redirectedRef.current = true;

    if (result.status === "APPROVED" && result.orderNumber) {
      if (!clearedCartRef.current) {
        clearedCartRef.current = true;
        clearCart();
      }
      router.replace(`/orders/${result.orderNumber}`);
      return;
    }

    const message =
      result.detail ||
      (result.status === "PENDING"
        ? "Pago pendiente. Te notificaremos cuando se confirme."
        : "El pago no se completó. Puedes intentar de nuevo.");
    const isPending = result.status === "PENDING";
    setReturnToast(isPending ? "info" : "error", message);
    router.replace("/cart");
  }, [result, router, clearCart]);

  // Siempre una única vista mínima de carga hasta que se hace la redirección
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Loader2 size={40} className="animate-spin text-black/40" aria-hidden="true" />
    </main>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-black/40" />
        </main>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  );
}
