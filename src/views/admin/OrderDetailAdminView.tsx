"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProductImageUrl } from "@/constant";
import {
  ArrowLeft,
  Package,
  MapPin,
  Mail,
  Phone,
  Truck,
  Trash2,
  AlertTriangle,
  X,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useFetchOrderQuery,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} from "@/store/features/orders/ordersApi";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";
import toast from "react-hot-toast";

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: LucideIcon; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-300",
  },
  processing: {
    label: "En proceso",
    icon: Package,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
  },
  shipped: {
    label: "Enviado",
    icon: Truck,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-300",
  },
  delivered: {
    label: "Entregado",
    icon: CheckCircle,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-300",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-300",
  },
};

export function OrderDetailAdminView() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam ?? "";

  const {
    data: orderData,
    isLoading,
    isError,
    error,
  } = useFetchOrderQuery(id, { skip: !id });

  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  const order = orderData?.data;
  const errorMessage = getApiErrorMessage(error);

  const handleStatusChange = async () => {
    if (!order || !pendingStatus) return;
    try {
      await updateOrder({ id: order.id, status: pendingStatus }).unwrap();
      toast.success("Estado actualizado");
      setPendingStatus(null);
    } catch (err) {
      toast.error("Error al actualizar el estado");
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    try {
      await deleteOrder(order.id).unwrap();
      toast.success(`Pedido eliminado`);
      router.push("/admin/orders");
    } catch (err) {
      toast.error("Error al eliminar el pedido");
    }
  };

  const formatPrice = (price: number | null | string) => {
    if (price === null || price === undefined) return "—";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "—";
    return `$${numPrice.toFixed(2)}`;
  };

  const formatDate = (date: Date | string | number) => {
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!id) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-neutral-600">ID de pedido inválido.</p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              <p className="text-black/60">Cargando pedido...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-black/10 bg-white p-12 text-center">
            <p className="mb-6 text-black/60">
              {errorMessage ?? "Pedido no encontrado."}
            </p>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-semibold text-white"
            >
              <ArrowLeft size={18} />
              Volver a pedidos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentStatus = statusConfig[order.status as OrderStatus] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;

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
            href="/admin/orders"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} />
            <span className="uppercase tracking-[0.2em]">Pedidos</span>
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-[0.05em] sm:text-3xl">
                  {order.orderNumber}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${currentStatus.bg} ${currentStatus.color} ${currentStatus.border}`}
                >
                  <StatusIcon size={14} />
                  {currentStatus.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-black/60">
                <Calendar size={14} />
                {formatDate(order.createdAt)}
              </div>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white"
            >
              <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-black/70" />
                  <h2 className="font-semibold">
                    Productos ({order.items?.length || 0})
                  </h2>
                </div>
              </div>
              <div className="divide-y divide-black/5">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: OrderItem) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-black/5">
                        <Image
                          src={getProductImageUrl(item.product?.imageUrl)}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.productName}</p>
                        <p className="text-sm text-black/50">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="p-5 text-black/50">Sin productos</p>
                )}
              </div>
            </motion.div>

            {/* Customer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white"
            >
              <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-black/70" />
                  <h2 className="font-semibold">Cliente</h2>
                </div>
              </div>
              <div className="p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">
                      <User size={18} className="text-black/50" />
                    </div>
                    <div>
                      <p className="text-xs text-black/50">Nombre</p>
                      <p className="font-medium">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">
                      <Mail size={18} className="text-black/50" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-black/50">Email</p>
                      <p className="truncate font-medium">{order.customerEmail}</p>
                    </div>
                  </div>
                  {order.customerPhone && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">
                        <Phone size={18} className="text-black/50" />
                      </div>
                      <div>
                        <p className="text-xs text-black/50">Teléfono</p>
                        <p className="font-medium">{order.customerPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Addresses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 sm:grid-cols-2"
            >
              {/* Shipping */}
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Truck size={18} className="text-black/70" />
                    <h2 className="font-semibold">Envío</h2>
                  </div>
                </div>
                <div className="p-5">
                  <p className="mb-1 font-medium">{order.customerName}</p>
                  <p className="text-sm text-black/70">{order.shippingStreet}</p>
                  <p className="text-sm text-black/70">
                    {order.shippingCity}, {order.shippingState} {order.shippingZip}
                  </p>
                  <p className="text-sm text-black/70">{order.shippingCountry}</p>
                  <div className="mt-3 rounded-lg bg-black/5 px-3 py-2 text-sm">
                    <span className="font-medium">
                      {order.shippingMethod === "standard"
                        ? "Estándar"
                        : order.shippingMethod === "express"
                          ? "Express"
                          : "Overnight"}
                    </span>
                    <span className="text-black/50">
                      {" "}
                      ·{" "}
                      {order.shippingMethod === "standard"
                        ? "5-7 días"
                        : order.shippingMethod === "express"
                          ? "2-3 días"
                          : "24 hrs"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billing */}
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-black/70" />
                    <h2 className="font-semibold">Facturación</h2>
                  </div>
                </div>
                <div className="p-5">
                  {order.billingStreet ? (
                    <>
                      <p className="text-sm text-black/70">{order.billingStreet}</p>
                      <p className="text-sm text-black/70">
                        {order.billingCity}, {order.billingState} {order.billingZip}
                      </p>
                      <p className="text-sm text-black/70">{order.billingCountry}</p>
                    </>
                  ) : (
                    <p className="text-sm text-black/50">
                      Misma que dirección de envío
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 text-sm">
                    <span>
                      {order.paymentMethod === "card"
                        ? "Tarjeta"
                        : order.paymentMethod === "cash"
                          ? "Efectivo"
                          : "Transferencia"}
                    </span>
                    <span
                      className={`font-medium ${
                        order.paymentStatus === "paid"
                          ? "text-green-600"
                          : order.paymentStatus === "failed"
                            ? "text-red-600"
                            : "text-amber-600"
                      }`}
                    >
                      {order.paymentStatus === "paid"
                        ? "Pagado"
                        : order.paymentStatus === "failed"
                          ? "Fallido"
                          : order.paymentStatus === "refunded"
                            ? "Reembolsado"
                            : "Pendiente"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Notes */}
            {order.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="overflow-hidden rounded-2xl border border-black/10 bg-white"
              >
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-black/70" />
                    <h2 className="font-semibold">Notas</h2>
                  </div>
                </div>
                <div className="p-5">
                  <p className="whitespace-pre-wrap text-sm text-black/70">
                    {order.notes}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Order Summary */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
              <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                <h3 className="font-semibold">Resumen</h3>
              </div>
              <div className="p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black/60">Subtotal</span>
                    <span className="font-medium">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Envío</span>
                    <span className="font-medium">
                      {formatPrice(order.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">IVA (16%)</span>
                    <span className="font-medium">{formatPrice(order.tax)}</span>
                  </div>
                  <div className="border-t border-black/10 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Update Status */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
              <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                <h3 className="font-semibold">Actualizar estado</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    Object.entries(statusConfig) as [
                      OrderStatus,
                      typeof statusConfig[OrderStatus],
                    ][]
                  ).map(([key, config]) => {
                    const Icon = config.icon;
                    const isActive = order.status === key;

                    return (
                      <button
                        key={key}
                        onClick={() => setPendingStatus(key)}
                        disabled={isUpdating || isActive}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                          isActive
                            ? `${config.bg} ${config.color} ${config.border}`
                            : "border-black/10 text-black/60 hover:bg-black/5"
                        } disabled:cursor-not-allowed`}
                      >
                        <Icon size={14} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Status Change Modal */}
        <AnimatePresence>
          {pendingStatus && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setPendingStatus(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
              >
                {(() => {
                  const newStatusConfig = statusConfig[pendingStatus];
                  const NewStatusIcon = newStatusConfig.icon;
                  return (
                    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                      <div className="p-6 text-center">
                        <div
                          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${newStatusConfig.bg}`}
                        >
                          <NewStatusIcon size={28} className={newStatusConfig.color} />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold">
                          Cambiar estado
                        </h3>
                        <p className="text-sm text-black/60">
                          ¿Cambiar el estado del pedido a{" "}
                          <span className={`font-semibold ${newStatusConfig.color}`}>
                            {newStatusConfig.label}
                          </span>
                          ?
                        </p>
                      </div>
                      <div className="flex border-t border-black/10">
                        <button
                          onClick={() => setPendingStatus(null)}
                          className="flex-1 border-r border-black/10 py-3 font-medium text-black/70 transition hover:bg-black/5"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleStatusChange}
                          disabled={isUpdating}
                          className={`flex-1 py-3 font-semibold transition hover:bg-black/5 disabled:opacity-50 ${newStatusConfig.color}`}
                        >
                          {isUpdating ? "Actualizando..." : "Confirmar"}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowDeleteModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
              >
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                  <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                      <AlertTriangle size={28} className="text-red-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Eliminar pedido</h3>
                    <p className="text-sm text-black/60">
                      ¿Eliminar{" "}
                      <span className="font-semibold">{order.orderNumber}</span>?
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <div className="flex border-t border-black/10">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 border-r border-black/10 py-3 font-medium text-black/70 transition hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
