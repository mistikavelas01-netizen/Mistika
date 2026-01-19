"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type Toast = { id: string; title: string; description?: string };

type ToastContextValue = {
  showToast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = ({ title, description }: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, description }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* UI */}
      <div className="fixed right-4 top-4 z-50 space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="w-[320px] rounded-2xl border bg-white p-4 shadow-lg"
          >
            <p className="font-medium text-neutral-900">{t.title}</p>
            {t.description ? (
              <p className="mt-1 text-sm text-neutral-600">{t.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
