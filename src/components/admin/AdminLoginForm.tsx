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
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      router.replace("/dashboard");
    } catch (nextError) {
      setError(mapFirebaseError(nextError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin login</h1>
        <p className="mt-1 text-sm text-black/60">Accede con tu correo y contraseña.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-lg border border-black/20 px-3 py-2 outline-none ring-black/20 transition focus:ring-2"
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
              className="w-full rounded-lg border border-black/20 px-3 py-2 outline-none ring-black/20 transition focus:ring-2"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-lg bg-black px-4 py-2 text-white transition enabled:hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </main>
  );
}
