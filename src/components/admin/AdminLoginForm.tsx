"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/context/AuthContext";

function mapFirebaseError(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "No se pudo iniciar sesión. Intenta nuevamente.";
  }

  switch (error.code) {
    case "auth/user-not-found":
      return "No existe un usuario con ese correo.";
    case "auth/wrong-password":
      return "La contraseña es incorrecta.";
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e intenta de nuevo.";
    default:
      return "No se pudo iniciar sesión. Intenta nuevamente.";
  }
}

export function AdminLoginForm() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(
    () => submitting || !email.trim() || !password,
    [email, password, submitting]
  );

  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin");
    }
  }, [loading, router, user]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      router.replace("/admin");
    } catch (nextError) {
      setError(mapFirebaseError(nextError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-neutral-100 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.08),_transparent_45%)]" />

      <div className="relative w-full max-w-md rounded-3xl border border-black/10 bg-white/90 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/45">
            Mistika Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-black/60">
            Accede con tu correo y contraseña para entrar al panel.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              placeholder="tu-correo@dominio.com"
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 outline-none ring-black/20 transition placeholder:text-black/35 focus:border-black/30 focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              placeholder="Tu contraseña"
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 outline-none ring-black/20 transition placeholder:text-black/35 focus:border-black/30 focus:ring-2"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={disabled}
            className="mt-2 w-full rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition enabled:hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </main>
  );
}
