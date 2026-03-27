"use client";

import type { ReactNode } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useRequireAuth();

  if (loading) {
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

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-sm text-black/60">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
            Redirigiendo al login...
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
