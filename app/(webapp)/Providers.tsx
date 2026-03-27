"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { StoreProvider } from "./StoreProvider";
import { CartProvider } from "@/context/cart-context";
import { AuthProvider } from "@/context/AuthContext";
import type { AppZone } from "@/lib/subdomain";

export function Providers({
  children,
  zone,
}: {
  children: ReactNode;
  zone: AppZone;
}) {
  const withAuth = zone === "admin";

  return (
    <StoreProvider>
      {withAuth ? (
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      ) : (
        <CartProvider>{children}</CartProvider>
      )}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2200,
          style: {
            borderRadius: "1rem",
            background: "#fff",
            color: "#000",
            padding: "16px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          },
        }}
      />
    </StoreProvider>
  );
}
