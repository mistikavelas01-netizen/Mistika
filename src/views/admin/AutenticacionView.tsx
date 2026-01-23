"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import {
  clearStoredToken,
  getStoredToken,
  isTokenValid,
  setStoredToken,
} from "@/lib/auth/client";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function AutenticacionView() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      return;
    }

    if (isTokenValid(token)) {
      router.replace("/admin");
      return;
    }

    clearStoredToken();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      if (!data?.token) {
        throw new Error("No se recibio un token valido");
      }

      setStoredToken(data.token);
      toast.success("Sesión iniciada correctamente");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || username.trim().length === 0 || password.length === 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8 text-center">
            <div className="mb-2">
              <p className="text-xs uppercase tracking-[0.4em] text-black/50">
                Panel de administración
              </p>
            </div>
            <h1 className="text-4xl font-semibold tracking-[0.05em] sm:text-5xl lg:text-6xl">
              Iniciar sesión
            </h1>
            <p className="mt-3 text-base text-black/60 sm:text-lg">
              Accede a tu cuenta para administrar tu tienda
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            variants={itemVariants}
            className="mx-auto max-w-md"
          >
            <div className="group relative overflow-hidden rounded-[32px] border border-black/10 bg-white p-8 shadow-[0_16px_36px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)]">
              <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-black/5 blur-3xl transition-transform duration-700 group-hover:scale-150" />
              
              <div className="relative">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-gradient-to-br from-black/5 to-black/10">
                    <Lock size={32} className="text-black/80" aria-hidden="true" />
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username */}
                  <div className="space-y-2">
                    <label
                      htmlFor="username"
                      className="block text-sm font-semibold text-black/80"
                    >
                      Usuario
                    </label>
                    <input
                      id="username"
                      name="username"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ingresa tu usuario"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-black/80"
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingresa tu contraseña"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 pr-12 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 transition hover:text-black/70"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? (
                          <EyeOff size={20} aria-hidden="true" />
                        ) : (
                          <Eye size={20} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      <span className="font-medium">Error:</span> {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={disabled}
                      className="w-full rounded-[24px] bg-black px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Ingresando...
                        </span>
                      ) : (
                        "Ingresar"
                      )}
                    </button>
                  </div>

                  {/* Forgot Password */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      className="text-xs text-black/50 underline decoration-black/15 underline-offset-4 transition hover:text-black/70"
                      onClick={() => toast.error("Funcionalidad en desarrollo")}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
