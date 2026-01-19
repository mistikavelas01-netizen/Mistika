"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Package,
  MapPin,
  Mail,
  Phone,
  Truck,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  CreditCard,
} from "lucide-react";
import { useFetchOrderQuery, useUpdateOrderMutation, useDeleteOrderMutation } from "@/store/features/orders/ordersApi";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";
import toast from "react-hot-toast";

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

  const [updateOrder] = useUpdateOrderMutation();
  const [deleteOrder] = useDeleteOrderMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const order = orderData?.data;
  const errorMessage = getApiErrorMessage(error);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    try {
      await updateOrder({ id: order.id, status: newStatus }).unwrap();
      toast.success("Estado actualizado");
    } catch (err) {
      toast.error("Error al actualizar el estado");
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    try {
      await deleteOrder(order.id).unwrap();
      toast.success(`Pedido ${order.orderNumber} eliminado`);
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

  const formatDate = (date: Date | string) => {
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
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
            <p className="text-black/60">Cargando pedido...</p>
          </div>
        </div>
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <p className="text-black/60">
              {errorMessage ?? "Pedido no encontrado."}
            </p>
            <Link
              href="/admin/orders"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Volver a pedidos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin/orders"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span className="uppercase tracking-[0.2em]">Volver a pedidos</span>
          </Link>
          <div className="mb-2">
            <p className="text-xs uppercase tracking-[0.4em] text-black/50">
              Detalle de pedido
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <h1 className="text-2xl font-semibold tracking-[0.05em] sm:text-4xl lg:text-5xl">
                {order.orderNumber}
              </h1>
              <span
                className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] sm:px-4 sm:py-2 ${statusColors[order.status as OrderStatus]}`}
              >
                {statusLabels[order.status as OrderStatus]}
              </span>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-700 transition hover:bg-red-100"
            >
              <Trash2 size={16} aria-hidden="true" />
              Eliminar
            </button>
          </div>
          <p className="mt-2 text-base text-black/60">
            Pedido realizado el {formatDate(order.createdAt)}
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-6 lg:p-8">
              <h2 className="mb-4 text-lg font-semibold tracking-[0.05em] sm:text-xl sm:mb-6">Productos</h2>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {order.items.map((item: OrderItem) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-xl border border-black/10 bg-black/5 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                    >
                      {(item as any).product?.imageUrl && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white">
                          <img
                            src={(item as any).product.imageUrl}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{item.productName}</p>
                        <p className="text-sm text-black/60">
                          Cantidad: {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-bold shrink-0">{formatPrice(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black/60">No hay productos en este pedido.</p>
              )}
            </div>

            {/* Customer Information */}
            <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-6 lg:p-8">
              <h2 className="mb-4 text-lg font-semibold tracking-[0.05em] sm:text-xl sm:mb-6">Información del cliente</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/5">
                    <Package size={20} className="text-black/70" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50">Cliente</p>
                    <p className="mt-1 font-semibold">{order.customerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/5">
                    <Mail size={20} className="text-black/70" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50">Email</p>
                    <p className="mt-1 font-medium text-black/80">{order.customerEmail}</p>
                  </div>
                </div>

                {order.customerPhone && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/5">
                      <Phone size={20} className="text-black/70" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-black/50">Teléfono</p>
                      <p className="mt-1 font-medium text-black/80">{order.customerPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-6 lg:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/5">
                  <MapPin size={20} className="text-black/80" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold tracking-[0.05em] sm:text-xl">Dirección de envío</h2>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-black/80">{order.shippingStreet}</p>
                <p className="text-black/80">
                  {order.shippingCity}, {order.shippingState} {order.shippingZip}
                </p>
                <p className="text-black/80">{order.shippingCountry}</p>
              </div>
            </div>

            {/* Billing Address if different */}
            {order.billingStreet && (
              <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-6 lg:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/5">
                    <CreditCard size={20} className="text-black/80" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-[0.05em] sm:text-xl">Dirección de facturación</h2>
                </div>
                <div className="space-y-2">
                  <p className="text-black/80">{order.billingStreet}</p>
                  <p className="text-black/80">
                    {order.billingCity}, {order.billingState} {order.billingZip}
                  </p>
                  <p className="text-black/80">{order.billingCountry}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-6 lg:p-8">
                <h2 className="mb-4 text-lg font-semibold tracking-[0.05em] sm:text-xl">Notas</h2>
                <p className="text-sm text-black/80 whitespace-pre-wrap sm:text-base">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Order Summary */}
            <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-6">
              <h3 className="mb-4 text-lg font-semibold tracking-[0.05em]">Resumen del pedido</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Subtotal</span>
                  <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Envío</span>
                  <span className="font-semibold">{formatPrice(order.shippingCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">IVA (16%)</span>
                  <span className="font-semibold">{formatPrice(order.tax)}</span>
                </div>
                <div className="border-t border-black/10 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold uppercase tracking-[0.1em]">Total</span>
                    <span className="text-xl font-bold">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-6">
              <h3 className="mb-3 text-base font-semibold tracking-[0.05em] sm:text-lg sm:mb-4">Estado del pedido</h3>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.1em] transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="pending">Pendiente</option>
                <option value="processing">En proceso</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            {/* Shipping Info */}
            <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-6">
              <div className="mb-3 flex items-center gap-3 sm:mb-4">
                <Truck size={20} className="text-black/80 shrink-0" aria-hidden="true" />
                <h3 className="text-base font-semibold tracking-[0.05em] sm:text-lg">Envío</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-semibold uppercase tracking-[0.1em]">
                  {order.shippingMethod === "standard"
                    ? "Estándar"
                    : order.shippingMethod === "express"
                      ? "Express"
                      : "Overnight"}
                </p>
                <p className="text-black/60">
                  {order.shippingMethod === "standard"
                    ? "5-7 días hábiles"
                    : order.shippingMethod === "express"
                      ? "2-3 días hábiles"
                      : "24 horas"}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-6">
              <h3 className="mb-3 text-base font-semibold tracking-[0.05em] sm:text-lg sm:mb-4">Pago</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Método</span>
                  <span className="font-semibold">
                    {order.paymentMethod === "card"
                      ? "Tarjeta"
                      : order.paymentMethod === "cash"
                        ? "Efectivo"
                        : order.paymentMethod === "transfer"
                          ? "Transferencia"
                          : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Estado</span>
                  <span
                    className={`font-semibold ${
                      order.paymentStatus === "paid"
                        ? "text-green-600"
                        : order.paymentStatus === "failed"
                          ? "text-red-600"
                          : "text-yellow-600"
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
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowDeleteModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
              >
                <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-black/5 text-black/60 transition hover:bg-black/10"
                    aria-label="Cerrar"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50">
                    <AlertTriangle size={32} className="text-red-600" aria-hidden="true" />
                  </div>
                  <h2 className="mb-3 text-center text-2xl font-semibold tracking-[0.05em]">
                    ¿Eliminar pedido?
                  </h2>
                  <p className="mb-8 text-center text-sm leading-relaxed text-black/70">
                    Estás a punto de eliminar el pedido <strong>"{order.orderNumber}"</strong>. Esta acción es irreversible y no se puede deshacer.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      type="button"
                      className="flex-1 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      type="button"
                      className="flex-1 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-red-700"
                    >
                      Eliminar
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
