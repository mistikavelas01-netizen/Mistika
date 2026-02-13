import { Suspense } from "react";
import { OrderDetailWithTokenView } from "@/views/orders/OrderDetailWithTokenView";

function OrderDetailsFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
          <p className="text-black/60">Cargando pedido...</p>
        </div>
      </div>
    </main>
  );
}

export default function OrderDetailWithToken() {
  return (
    <Suspense fallback={<OrderDetailsFallback />}>
      <OrderDetailWithTokenView />
    </Suspense>
  );
}
