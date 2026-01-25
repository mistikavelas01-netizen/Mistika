"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearStoredToken,
  getStoredToken,
  isTokenValid,
} from "@/lib/auth/client";

type AdminGuardProps = {
  children: ReactNode;
};

/**
 * Verifica el token con el servidor para validar la firma criptográfica
 */
async function verifyTokenWithServer(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/verify", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = getStoredToken();
      
      // Primera validación rápida en cliente (expiración y rol)
      if (!token || !isTokenValid(token)) {
        clearStoredToken();
        setAllowed(false);
        setChecking(false);
        router.replace("/login");
        return;
      }

      // Segunda validación: verificar firma con el servidor
      const isValid = await verifyTokenWithServer(token);
      
      if (!isValid) {
        clearStoredToken();
        setAllowed(false);
        setChecking(false);
        router.replace("/login");
        return;
      }

      setAllowed(true);
      setChecking(false);
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-sm text-black/60">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
            Verificando sesión...
          </div>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
