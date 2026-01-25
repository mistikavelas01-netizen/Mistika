"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingBag,
  Plus,
  TrendingUp,
  Tag,
  LogOut,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ArrowRight,
  Eye,
  Home,
} from "lucide-react";
import { useFetchProductsQuery } from "@/store/features/products/productsApi";
import { useFetchOrdersQuery } from "@/store/features/orders/ordersApi";
import { clearStoredToken } from "@/lib/auth/client";
import { ServerError } from "@/components/ui/ServerError";
import toast from "react-hot-toast";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pendiente", color: "text-amber-700", bg: "bg-amber-100", icon: Clock },
  processing: { label: "Procesando", color: "text-blue-700", bg: "bg-blue-100", icon: Package },
  shipped: { label: "Enviado", color: "text-purple-700", bg: "bg-purple-100", icon: Truck },
  delivered: { label: "Entregado", color: "text-green-700", bg: "bg-green-100", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "text-red-700", bg: "bg-red-100", icon: AlertCircle },
};

export function DashboardView() {
  const router = useRouter();
  const { data: productsData, isLoading: isLoadingProducts, isError: isErrorProducts, refetch: refetchProducts } = useFetchProductsQuery(
    { page: 1, limit: 100 },
    { skip: false }
  );
  const { data: ordersData, isLoading: isLoadingOrders, isError: isErrorOrders, refetch: refetchOrders } = useFetchOrdersQuery(
    { page: 1, limit: 100 },
    { skip: false }
  );

  const isError = isErrorProducts || isErrorOrders;
  const refetch = () => {
    refetchProducts();
    refetchOrders();
  };

  const products = productsData?.data ?? [];
  const orders = ordersData?.data ?? [];

  const totalProducts = products.length;
  const activeProducts = products.filter((p: Product) => p.isActive).length;
  const totalOrders = orders.length;

  // Order stats by status
  const pendingOrders = orders.filter((o: Order) => o.status === "pending").length;
  const processingOrders = orders.filter((o: Order) => o.status === "processing").length;
  const shippedOrders = orders.filter((o: Order) => o.status === "shipped").length;
  const deliveredOrders = orders.filter((o: Order) => o.status === "delivered").length;

  // Recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  // Orders that need attention (pending + processing)
  const ordersNeedingAttention = pendingOrders + processingOrders;

  const handleLogout = () => {
    clearStoredToken();
    toast.success("Sesión cerrada");
    router.replace("/login");
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };

  if (isError) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <ServerError
          title="Error de conexión"
          message="No pudimos conectar con el servidor. Por favor, verifica tu conexión o intenta más tarde."
          onRetry={refetch}
          showHomeButton={false}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-black/50">
                Panel de administración
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[0.05em] sm:text-4xl">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/70 transition hover:bg-black hover:text-white"
              >
                <Home size={18} />
                <span className="hidden sm:inline">Ver tienda</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-black/70 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Orders Alert Banner */}
        {ordersNeedingAttention > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Link
              href="/admin/orders"
              className="group flex items-center justify-between rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 transition-all hover:border-amber-400 hover:shadow-lg sm:p-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg sm:h-14 sm:w-14">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-900 sm:text-xl">
                    {ordersNeedingAttention} pedido{ordersNeedingAttention > 1 ? "s" : ""} requiere
                    {ordersNeedingAttention > 1 ? "n" : ""} atención
                  </p>
                  <p className="text-sm text-amber-700">
                    {pendingOrders} pendiente{pendingOrders !== 1 ? "s" : ""} · {processingOrders} en
                    proceso
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-700 transition-transform group-hover:translate-x-1">
                <span className="hidden font-semibold sm:inline">Ver pedidos</span>
                <ArrowRight size={20} />
              </div>
            </Link>
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Orders Section - Most Prominent */}
          <motion.section variants={cardVariants}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-[0.05em]">Pedidos</h2>
              <Link
                href="/admin/orders"
                className="flex items-center gap-1 text-sm font-medium text-black/60 transition hover:text-black"
              >
                Ver todos <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Pending */}
              <Link
                href="/admin/orders?status=pending"
                className="group relative overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 transition-all hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-amber-900">
                      {isLoadingOrders ? "..." : pendingOrders}
                    </p>
                    <p className="mt-1 text-sm font-medium text-amber-700">Pendientes</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                    <Clock size={24} className="text-amber-700" />
                  </div>
                </div>
              </Link>

              {/* Processing */}
              <Link
                href="/admin/orders?status=processing"
                className="group relative overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-900">
                      {isLoadingOrders ? "..." : processingOrders}
                    </p>
                    <p className="mt-1 text-sm font-medium text-blue-700">En proceso</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                    <Package size={24} className="text-blue-700" />
                  </div>
                </div>
              </Link>

              {/* Shipped */}
              <Link
                href="/admin/orders?status=shipped"
                className="group relative overflow-hidden rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-5 transition-all hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-purple-900">
                      {isLoadingOrders ? "..." : shippedOrders}
                    </p>
                    <p className="mt-1 text-sm font-medium text-purple-700">Enviados</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                    <Truck size={24} className="text-purple-700" />
                  </div>
                </div>
              </Link>

              {/* Delivered */}
              <Link
                href="/admin/orders?status=delivered"
                className="group relative overflow-hidden rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 transition-all hover:-translate-y-1 hover:border-green-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-900">
                      {isLoadingOrders ? "..." : deliveredOrders}
                    </p>
                    <p className="mt-1 text-sm font-medium text-green-700">Entregados</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                    <CheckCircle size={24} className="text-green-700" />
                  </div>
                </div>
              </Link>
            </div>
          </motion.section>

          {/* Recent Orders Table */}
          <motion.section variants={cardVariants}>
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
              <div className="border-b border-black/10 bg-black/5 px-6 py-4">
                <h3 className="font-semibold">Pedidos recientes</h3>
              </div>

              {isLoadingOrders ? (
                <div className="p-8 text-center text-black/50">Cargando pedidos...</div>
              ) : recentOrders.length === 0 ? (
                <div className="p-8 text-center text-black/50">No hay pedidos aún</div>
              ) : (
                <div className="divide-y divide-black/5">
                  {recentOrders.map((order: Order) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="group flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-black/5"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${status.bg}`}
                          >
                            <StatusIcon size={18} className={status.color} />
                          </div>
                          <div>
                            <p className="font-semibold text-black">{order.orderNumber}</p>
                            <p className="text-sm text-black/60">{order.customerName}</p>
                          </div>
                        </div>

                        <div className="hidden text-right sm:block">
                          <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-xs text-black/50">{formatDate(order.createdAt)}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.color}`}
                          >
                            {status.label}
                          </span>
                          <Eye
                            size={18}
                            className="text-black/30 transition group-hover:text-black"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-black/10 bg-black/5 px-6 py-3">
                <Link
                  href="/admin/orders"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-black/70 transition hover:text-black"
                >
                  Ver todos los pedidos
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.section>

          {/* Quick Actions Grid */}
          <motion.section variants={cardVariants}>
            <h2 className="mb-4 text-xl font-semibold tracking-[0.05em]">Acciones rápidas</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Products */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <div className="flex flex-1 items-center gap-4 border-b border-black/10 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/5">
                    <Package size={24} className="text-black/70" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Productos</h3>
                    <p className="text-sm text-black/60">
                      {isLoadingProducts ? "..." : `${activeProducts} activos de ${totalProducts}`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-black/10">
                  <Link
                    href="/admin/products"
                    className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-black/70 transition hover:bg-black hover:text-white"
                  >
                    <Eye size={16} />
                    Ver todos
                  </Link>
                  <Link
                    href="/admin/products/new"
                    className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-black/70 transition hover:bg-black hover:text-white"
                  >
                    <Plus size={16} />
                    Nuevo
                  </Link>
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <div className="flex flex-1 items-center gap-4 border-b border-black/10 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/5">
                    <Tag size={24} className="text-black/70" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Categorías</h3>
                    <p className="text-sm text-black/60">Organiza tu catálogo</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-black/10">
                  <Link
                    href="/admin/categories"
                    className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-black/70 transition hover:bg-black hover:text-white"
                  >
                    <Eye size={16} />
                    Ver todas
                  </Link>
                  <Link
                    href="/admin/categories/new"
                    className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-black/70 transition hover:bg-black hover:text-white"
                  >
                    <Plus size={16} />
                    Nueva
                  </Link>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <div className="flex flex-1 items-center gap-4 border-b border-black/10 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <TrendingUp size={24} className="text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Resumen</h3>
                    <p className="text-sm text-black/60">Estado general</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-black/10 py-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{isLoadingOrders ? "..." : totalOrders}</p>
                    <p className="text-xs text-black/50">Pedidos totales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{isLoadingProducts ? "..." : totalProducts}</p>
                    <p className="text-xs text-black/50">Productos</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </main>
  );
}
