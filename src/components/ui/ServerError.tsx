"use client";

import Image from "next/image";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";
import { NOT_SERVER_ERROR_IMAGE } from "@/constant";

type Props = {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  onRetry?: () => void;
};

export function ServerError({
  title = "Error de conexión",
  message = "No pudimos conectar con el servidor. Por favor, verifica tu conexión o intenta más tarde.",
  showHomeButton = true,
  onRetry,
}: Props) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Error Image */}
        <div className="relative mx-auto mb-8 aspect-square w-64 overflow-hidden rounded-3xl">
          <Image
            src={NOT_SERVER_ERROR_IMAGE}
            alt="Error de servidor"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-semibold tracking-tight">{title}</h2>

        {/* Message */}
        <p className="mb-8 text-black/60">{message}</p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <RefreshCw size={18} />
              Reintentar
            </button>
          )}
          {showHomeButton && (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 px-6 py-3 font-semibold text-black/70 transition hover:bg-black/5"
            >
              <Home size={18} />
              Ir al inicio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
