"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  MapPin,
  Mail,
  Phone,
  Truck,
  CheckCircle,
} from "lucide-react";
import { useFetchOrderByNumberQuery } from "@/store/features/orders/ordersApi";
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

export function OrderDetailView() {
  const params = useParams();
  const orderNumberParam = params?.orderNumber;
  const orderNumber = Array.isArray(orderNumberParam)
    ? orderNumberParam[0]
    : (orderNumberParam ?? "");

  const {
    data: orderData,
    isLoading,
    isError,
    error,
  } = useFetchOrderByNumberQuery(orderNumber, { skip: !orderNumber });

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

  if (!orderNumber) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-neutral-600">Número de pedido inválido.</p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex min-h-[480px] flex-col items-center justify-center rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
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
              Confirmación de pedido
            </p>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-semibold tracking-[0.05em] sm:text-5xl">
              {order.orderNumber}
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

        {/* Success / Status Message */}
        {order.status === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-[32px] border border-green-200 bg-green-50 p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle
                  size={24}
                  className="text-green-700"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-green-900">
                  {order.paymentStatus === "paid"
                    ? "¡Pago confirmado! Pedido en proceso"
                    : "¡Pedido recibido!"}
                </h3>
                <p className="text-sm text-green-800">
                  {order.paymentStatus === "paid"
                    ? "Tu pago fue procesado correctamente. Estamos preparando tu pedido."
                    : `Tu pedido ha sido recibido${order.paymentStatus === "pending" ? ". Completa el pago en Mercado Pago para continuar." : "."} Te enviaremos un correo de confirmación a ${order.customerEmail}.`}
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
              <h2 className="mb-6 text-xl font-semibold tracking-[0.05em]">
                Productos
              </h2>
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
                          Cantidad: {item.quantity} ×{" "}
                          {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-bold">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black/60">
                  No hay productos en este pedido.
                </p>
              )}
            </div>

            {/* Shipping Address */}
            <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)] sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-black/5">
                  <MapPin
                    size={20}
                    className="text-black/80"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="text-xl font-semibold tracking-[0.05em]">
                  Dirección de envío
                </h2>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-black/80">{order.shippingStreet}</p>
                <p className="text-black/80">
                  {order.shippingCity}, {order.shippingState}{" "}
                  {order.shippingZip}
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
                  <span className="font-semibold">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Envío</span>
                  <span className="font-semibold">
                    {formatPrice(order.shippingCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">IVA (16%)</span>
                  <span className="font-semibold">
                    {formatPrice(order.tax)}
                  </span>
                </div>
                <div className="border-t border-black/10 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold uppercase tracking-[0.1em]">
                      Total
                    </span>
                    <span className="text-xl font-bold">
                      {formatPrice(order.totalAmount)}
                    </span>
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
                  <Mail
                    size={16}
                    className="mt-0.5 text-black/60"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                      Email
                    </p>
                    <p className="font-medium text-black/90">
                      {order.customerEmail}
                    </p>
                  </div>
                </div>
                {order.customerPhone && (
                  <div className="flex items-start gap-3">
                    <Phone
                      size={16}
                      className="mt-0.5 text-black/60"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                        Teléfono
                      </p>
                      <p className="font-medium text-black/90">
                        {order.customerPhone}
                      </p>
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
                      : "No especificado"}
                </p>

                <p className="text-black/60">
                  {order.shippingMethod === "standard"
                    ? "5-7 días hábiles"
                    : order.shippingMethod === "express"
                      ? "2-3 días hábiles"
                      : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
