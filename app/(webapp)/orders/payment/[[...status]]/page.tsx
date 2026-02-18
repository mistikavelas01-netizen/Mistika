"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

/**
 * Redirección: la página de retorno de pago unificada está en /checkout/return.
 * Mantenemos esta ruta para no romper enlaces antiguos (success/failure/pending).
 */
function RedirectToCheckoutReturn() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(qs ? `/checkout/return?${qs}` : "/checkout/return");
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
    </main>
  );
}

export default function PaymentReturnRedirectPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
        </main>
      }
    >
      <RedirectToCheckoutReturn />
    </Suspense>
  );
}
