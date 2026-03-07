import { Suspense } from "react";
import { OrderByNumberRedirectView } from "@/views/orders/OrderByNumberRedirectView";

export default function OrderDetail() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-black/40" />
        </main>
      }
    >
      <OrderByNumberRedirectView />
    </Suspense>
  );
}
