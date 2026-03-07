"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useFetchOrderByNumberQuery } from "@/store/features/orders/ordersApi";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";

export function OrderByNumberRedirectView() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawOrderNumber = params?.orderNumber;
  const orderNumber = Array.isArray(rawOrderNumber)
    ? rawOrderNumber[0] ?? ""
    : (rawOrderNumber ?? "");
  const token = searchParams.get("token") ?? "";
  const expires = searchParams.get("expires") ?? "";
  const hasRequiredParams = Boolean(orderNumber && token && expires);

  const {
    data: orderData,
    isLoading,
    isError,
    error,
  } = useFetchOrderByNumberQuery(
    { orderNumber, token, expires },
    { skip: !hasRequiredParams }
  );

  const orderId =
    orderData?.data && typeof orderData.data.id === "string"
      ? orderData.data.id
      : "";
  const errorMessage = getApiErrorMessage(error);

  useEffect(() => {
    if (!orderId || !token || !expires) return;

    const safeOrderId = encodeURIComponent(orderId);
    const safeToken = encodeURIComponent(token);
    const safeExpires = encodeURIComponent(expires);
    router.replace(
      `/orders/details/${safeOrderId}?token=${safeToken}&expires=${safeExpires}`
    );
  }, [orderId, token, expires, router]);

  if (!hasRequiredParams) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-[32px] border border-red-200 bg-red-50 p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <p className="text-red-800">Enlace inválido o expirado.</p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading || orderId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-black/40" />
          <p className="text-sm text-black/60">
            Redirigiendo al enlace seguro del pedido...
          </p>
        </div>
      </main>
    );
  }

  if (isError || !orderId) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-[32px] border border-red-200 bg-red-50 p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <p className="text-red-800">
              {errorMessage ?? "No se pudo validar el acceso al pedido."}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
