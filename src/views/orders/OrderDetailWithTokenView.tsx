"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Package, MapPin, Mail, Phone, Truck, CheckCircle, AlertCircle } from "lucide-react";
import { useFetchOrderDetailsWithTokenQuery } from "@/store/features/orders/ordersApi";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";
import { getProductImageUrl } from "@/constant";

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

export function OrderDetailWithTokenView() {
  const params = useParams();
  const searchParams = useSearchParams();

  const idParam = params?.id;
  const orderId = typeof idParam === "string" ? idParam : Array.isArray(idParam) ? idParam[0] ?? "" : "";

  const token = searchParams.get("token");
  const orderNumber = searchParams.get("orderNumber");

  const {
    data: orderData,
    isLoading,
    isError,
    error,
  } = useFetchOrderDetailsWithTokenQuery(
    { id: orderId, token: token || "" },
    { skip: !orderId || !token }
  );

  const order = orderData?.data;
  const errorMessage = getApiErrorMessage(error);

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

  if (!orderId || !token) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-[32px] border border-red-200 bg-red-50 p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle size={24} className="text-red-700" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-red-900">
              Enlace inválido
            </h2>
            <p className="text-red-800">
              El enlace de acceso no es válido. Por favor, usa el enlace que recibiste por correo electrónico.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Volver al inicio
            </Link>
          </div>
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
          <div className="rounded-[32px] border border-red-200 bg-red-50 p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle size={24} className="text-red-700" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-red-900">
              No se pudo cargar el pedido
            </h2>
            <p className="text-red-800">
              {errorMessage || "El token no es válido o el pedido no existe."}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Volver al inicio
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
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span className="uppercase tracking-[0.2em]">Volver</span>
          </Link>
          <div className="mb-2">
            <p className="text-xs uppercase tracking-[0.4em] text-black/50">
              Seguimiento de pedido
            </p>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-semibold tracking-[0.05em] sm:text-5xl">
              {order.orderNumber || orderNumber}
            </h1>
            <span
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${statusColors[order.status as OrderStatus]}`}
            >
              {statusLabels[order.status as OrderStatus]}
            </span>
          </div>
          <p className="mt-2 text-base text-black/60">
            Pedido realizado el {formatDate(order.createdAt)}
          </p>
        </motion.div>

        {/* Status Message */}
        {order.status === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-[32px] border border-blue-200 bg-blue-50 p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Package size={24} className="text-blue-700" aria-hidden="true" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-blue-900">
                  Pedido en proceso
                </h3>
                <p className="text-sm text-blue-800">
                  Tu pedido está siendo procesado. Te notificaremos cuando sea enviado.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {order.status === "shipped" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-[32px] border border-purple-200 bg-purple-50 p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
                <Truck size={24} className="text-purple-700" aria-hidden="true" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-purple-900">
                  Pedido enviado
                </h3>
                <p className="text-sm text-purple-800">
                  Tu pedido ha sido enviado y está en camino.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {order.status === "delivered" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-[32px] border border-green-200 bg-green-50 p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle size={24} className="text-green-700" aria-hidden="true" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-green-900">
                  Pedido entregado
                </h3>
                <p className="text-sm text-green-800">
                  ¡Tu pedido ha sido entregado exitosamente!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-8">
              <h2 className="mb-6 text-xl font-semibold tracking-[0.05em]">Productos</h2>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-4">
                  {order.items.map((item: OrderItem) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-xl border border-black/10 bg-black/5 p-4"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white">
                        <img
                          src={getProductImageUrl(item.product?.imageUrl)}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-sm text-black/60">
                          Cantidad: {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-bold">{formatPrice(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black/60">No hay productos en este pedido.</p>
              )}
            </div>

            {/* Shipping Address */}
            <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-black/5">
                  <MapPin size={20} className="text-black/80" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-semibold tracking-[0.05em]">
                  Dirección de envío
                </h2>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-black/80">
                  {order.shippingStreet}
                </p>
                <p className="text-black/80">
                  {order.shippingCity}, {order.shippingState} {order.shippingZip}
                </p>
                <p className="text-black/80">{order.shippingCountry}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
              <h3 className="mb-4 text-lg font-semibold tracking-[0.05em]">
                Resumen del pedido
              </h3>
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

            {/* Customer Info */}
            <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
              <h3 className="mb-4 text-lg font-semibold tracking-[0.05em]">
                Información de contacto
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 text-black/60" aria-hidden="true" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50">Email</p>
                    <p className="font-medium text-black/90">{order.customerEmail}</p>
                  </div>
                </div>
                {order.customerPhone && (
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="mt-0.5 text-black/60" aria-hidden="true" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-black/50">Teléfono</p>
                      <p className="font-medium text-black/90">{order.customerPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex items-center gap-3">
                <Truck size={20} className="text-black/80" aria-hidden="true" />
                <h3 className="text-lg font-semibold tracking-[0.05em]">
                  Envío
                </h3>
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
          </div>
        </div>
      </div>
    </main>
  );
}
