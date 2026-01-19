"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, Filter, ArrowLeft } from "lucide-react";
import { useFetchOrdersQuery } from "@/store/features/orders/ordersApi";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";
import Link from "next/link";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export function OrdersAdminView() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 20;

  const {
    data: ordersData,
    isLoading,
    isError,
    error,
  } = useFetchOrdersQuery(
    {
      page,
      limit,
      status: statusFilter !== "all" ? statusFilter : undefined,
    },
    { skip: false }
  );

  const orders = ordersData?.data ?? [];
  const pagination = ordersData?.pagination;
  const errorMessage = getApiErrorMessage(error);

  const filteredOrders = orders.filter((order: Order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerEmail.toLowerCase().includes(query)
    );
  });

  const formatPrice = (price: number | null | string) => {
    if (price === null || price === undefined) return "—";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "—";
    return `$${numPrice.toFixed(2)}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span className="uppercase tracking-[0.2em]">Volver al dashboard</span>
          </Link>
          <div className="mb-2">
            <p className="text-xs uppercase tracking-[0.4em] text-black/50">
              Administración
            </p>
          </div>
          <h1 className="mb-3 text-4xl font-semibold tracking-[0.05em] sm:text-5xl">
            Pedidos
          </h1>
          <p className="text-base text-black/60">
            Gestiona los pedidos de tus clientes
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar por número, nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-12 py-3 text-black placeholder:text-black/40 transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-black/40" aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderStatus | "all");
                setPage(1);
              }}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="processing">En proceso</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Orders */}
        {isLoading ? (
          <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
            <p className="text-black/60">Cargando pedidos...</p>
          </div>
        ) : isError ? (
          <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <p className="text-black/60">
              {errorMessage ?? "No se pudieron cargar los pedidos."}
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-black/5">
              <ShoppingBag size={40} className="text-black/30" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">No hay pedidos</h2>
            <p className="text-black/60">
              {searchQuery || statusFilter !== "all"
                ? "No se encontraron pedidos con ese criterio"
                : "Cuando los clientes realicen pedidos, aparecerán aquí"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <AnimatePresence>
                {filteredOrders.map((order: Order, index: number) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative overflow-hidden rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 cursor-pointer my-5"
                    >
                      {/* Decorative background */}
                      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-black/5 blur-2xl transition-transform duration-700 group-hover:scale-150" />

                      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        {/* Left: Order info */}
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <h3 className="text-base font-bold tracking-[0.05em] truncate sm:text-lg">
                              {order.orderNumber}
                            </h3>
                            <span
                              className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] shrink-0 ${statusColors[order.status]}`}
                            >
                              {statusLabels[order.status]}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-black/60 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:text-sm">
                            <p className="truncate">{order.customerName}</p>
                            <p className="truncate">{order.customerEmail}</p>
                            <p className="hidden sm:inline">{formatDate(order.createdAt)}</p>
                          </div>
                          <p className="mt-1 text-xs text-black/50 sm:hidden">{formatDate(order.createdAt)}</p>
                        </div>

                        {/* Right: Total and arrow */}
                        <div className="flex items-center justify-between sm:justify-end sm:gap-4 shrink-0">
                          <span className="text-lg font-bold sm:text-xl">
                            {formatPrice(order.totalAmount)}
                          </span>
                          <span className="text-black/40 transition-transform group-hover:translate-x-1 hidden sm:inline">→</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
              >
                <p className="text-sm text-black/60">
                  Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} de {pagination.total} pedidos
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPreviousPage || isLoading}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                  >
                    ←
                  </button>
                  <span className="px-4 text-sm font-medium">
                    Página {page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage || isLoading}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                  >
                    →
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
