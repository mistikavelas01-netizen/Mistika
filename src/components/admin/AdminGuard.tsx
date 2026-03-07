"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

async function clearServerSession(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const currentPath = (() => {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  })();
  const loginTarget = `/login?next=${encodeURIComponent(currentPath)}`;

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const token = getStoredToken();
      
      // Primera validación rápida en cliente (expiración y rol)
      if (!token || !isTokenValid(token)) {
        clearStoredToken();
        void clearServerSession();
        if (cancelled) return;
        setAllowed(false);
        setChecking(false);
        router.replace(loginTarget);
        return;
      }

      // Segunda validación: verificar firma con el servidor
      const isValid = await verifyTokenWithServer(token);
      
      if (!isValid) {
        clearStoredToken();
        void clearServerSession();
        if (cancelled) return;
        setAllowed(false);
        setChecking(false);
        router.replace(loginTarget);
        return;
      }

      if (cancelled) return;
      setAllowed(true);
      setChecking(false);
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router, loginTarget]);

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
