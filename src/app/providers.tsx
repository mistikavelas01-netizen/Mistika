"use client";

import { CartProvider } from "@/context/cart-context";
import { ToastProvider } from "@/components/common/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CartProvider>{children}</CartProvider>
    </ToastProvider>
  );
}
