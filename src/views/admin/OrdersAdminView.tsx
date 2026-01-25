"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Search,
  ArrowLeft,
  X,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useFetchOrdersQuery } from "@/store/features/orders/ordersApi";
import { ServerError } from "@/components/ui/ServerError";
import Link from "next/link";

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  processing: {
    label: "Procesando",
    icon: Package,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  shipped: {
    label: "Enviado",
    icon: Truck,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  delivered: {
    label: "Entregado",
    icon: CheckCircle,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

export function OrdersAdminView() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 15;

  const {
    data: ordersData,
    isLoading,
    isError,
    refetch,
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

  const filteredOrders = orders.filter((order: Order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerEmail.toLowerCase().includes(query)
    );
  });

  // Stats counts
  const allOrdersCount = pagination?.total || orders.length;

  const formatPrice = (price: number | null | string) => {
    if (price === null || price === undefined) return "—";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "—";
    return `$${numPrice.toFixed(2)}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusTabs = [
    { key: "all", label: "Todos" },
    { key: "pending", label: "Pendientes" },
    { key: "processing", label: "En proceso" },
    { key: "shipped", label: "Enviados" },
    { key: "delivered", label: "Entregados" },
    { key: "cancelled", label: "Cancelados" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} />
            <span className="uppercase tracking-[0.2em]">Dashboard</span>
          </Link>

          <h1 className="text-3xl font-semibold tracking-[0.05em] sm:text-4xl">
            Pedidos
          </h1>
          <p className="mt-1 text-black/60">
            Gestiona los pedidos de tus clientes
          </p>
        </motion.div>

        {/* Status Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key as OrderStatus | "all");
                  setPage(1);
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  statusFilter === tab.key
                    ? "bg-black text-white"
                    : "bg-white border border-black/10 text-black/70 hover:bg-black/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
            />
            <input
              type="text"
              placeholder="Buscar por número, nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white py-3 pl-11 pr-10 transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              <p className="text-black/60">Cargando pedidos...</p>
            </div>
          </div>
        ) : isError ? (
          <ServerError
            title="Error de conexión"
            message="No pudimos cargar los pedidos. Por favor, verifica tu conexión o intenta más tarde."
            onRetry={refetch}
            showHomeButton={false}
          />
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-black/10 bg-white p-12 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
              <ShoppingBag size={32} className="text-black/30" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              {searchQuery || statusFilter !== "all"
                ? "Sin resultados"
                : "No hay pedidos"}
            </h2>
            <p className="text-black/60">
              {searchQuery || statusFilter !== "all"
                ? "Intenta con otros filtros"
                : "Los pedidos de tus clientes aparecerán aquí"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-black/10 bg-white"
          >
            {/* Table Header */}
            <div className="hidden border-b border-black/10 bg-black/5 px-6 py-3 lg:grid lg:grid-cols-12 lg:gap-4">
              <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-black/50">
                Pedido
              </div>
              <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-black/50">
                Cliente
              </div>
              <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-black/50">
                Fecha
              </div>
              <div className="col-span-2 text-center text-xs font-semibold uppercase tracking-wider text-black/50">
                Estado
              </div>
              <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wider text-black/50">
                Total
              </div>
              <div className="col-span-1 text-right text-xs font-semibold uppercase tracking-wider text-black/50">
                Acción
              </div>
            </div>

            {/* Order List */}
            <div className="divide-y divide-black/5">
              {filteredOrders.map((order: Order, index: number) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group px-4 py-4 transition hover:bg-black/[0.02] lg:grid lg:grid-cols-12 lg:items-center lg:gap-4 lg:px-6"
                  >
                    {/* Order Number */}
                    <div className="col-span-3 mb-2 lg:mb-0">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${status.bg}`}
                        >
                          <StatusIcon size={18} className={status.color} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-black/50 lg:hidden">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="col-span-3 mb-2 lg:mb-0">
                      <p className="truncate font-medium">{order.customerName}</p>
                      <p className="truncate text-sm text-black/50">
                        {order.customerEmail}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 hidden text-sm text-black/60 lg:block">
                      {formatDate(order.createdAt)}
                    </div>

                    {/* Status */}
                    <div className="col-span-2 mb-3 flex lg:mb-0 lg:justify-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${status.bg} ${status.color} ${status.border}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {status.label}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="col-span-1 mb-3 lg:mb-0 lg:text-right">
                      <span className="text-lg font-bold lg:text-base">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="col-span-1 flex justify-end">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex h-9 items-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-medium text-black/70 transition hover:bg-black hover:text-white lg:w-9 lg:justify-center lg:px-0"
                      >
                        <Eye size={16} />
                        <span className="lg:hidden">Ver detalles</span>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
          >
            <p className="text-sm text-black/50">
              Mostrando {(page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, pagination.total)} de {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPreviousPage || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 text-sm font-medium">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNextPage || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
