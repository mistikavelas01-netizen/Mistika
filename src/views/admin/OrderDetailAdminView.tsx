"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProductImageUrl } from "@/constant";
import {
  ArrowLeft,
  Package,
  Mail,
  Phone,
  Truck,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Calendar,
  RotateCcw,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useFetchOrderQuery,
  useUpdateOrderMutation,
  useRefundOrderPaymentMutation,
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

const lockedStatuses = new Set<OrderStatus>(["delivered", "cancelled"]);

export function OrderDetailAdminView() {
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam ?? "";

  const {
    data: orderData,
    isLoading,
    isError,
    error,
  } = useFetchOrderQuery(id, { skip: !id });

  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const [refundOrderPayment, { isLoading: isRefunding }] =
    useRefundOrderPaymentMutation();
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [showLockedStatusInfo, setShowLockedStatusInfo] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundType, setRefundType] = useState<OrderRefundType>("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const order = orderData?.data;
  const errorMessage = getApiErrorMessage(error);
  const isDeliveredOrder = order?.status === "delivered";
  const isFullyRefunded = Boolean(
    order &&
      (order.paymentStatus === "refunded" || order.refundStatus === "full"),
  );
  const isStatusLocked = order
    ? lockedStatuses.has(order.status) || isFullyRefunded
    : false;
  const refundedAmount = Number(order?.refundedAmount ?? 0);
  const remainingRefundableAmount = order
    ? Math.max(0, Number(order.totalAmount ?? 0) - refundedAmount)
    : 0;
  const canRefund = Boolean(
    order?.mpPaymentId &&
      !isDeliveredOrder &&
      order.paymentStatus === "paid" &&
      remainingRefundableAmount > 0.01,
  );

  const handleStatusChange = async () => {
    if (!order || !pendingStatus) return;
    if (lockedStatuses.has(order.status) || isFullyRefunded) {
      toast.error("Este pedido ya está finalizado y no permite cambios de estado");
      setPendingStatus(null);
      return;
    }

    try {
      await updateOrder({ id: order.id, status: pendingStatus }).unwrap();
      toast.success("Estado actualizado");
      setPendingStatus(null);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err as Parameters<typeof getApiErrorMessage>[0]) ??
          "Error al actualizar el estado",
      );
    }
  };

  const closeRefundModal = () => {
    if (isRefunding) return;
    setShowRefundModal(false);
    setRefundType("full");
    setRefundAmount("");
    setRefundReason("");
  };

  const handleRefund = async () => {
    if (!order || !canRefund) return;

    const normalizedReason = refundReason.trim();
    const parsedAmount = Number(refundAmount);
    if (!normalizedReason) {
      toast.error("Debes capturar el motivo del reembolso");
      return;
    }

    if (
      refundType === "partial" &&
      (!Number.isFinite(parsedAmount) ||
        parsedAmount <= 0 ||
        parsedAmount > remainingRefundableAmount)
    ) {
      toast.error("El monto parcial es inválido");
      return;
    }

    try {
      await refundOrderPayment({
        id: order.id,
        type: refundType,
        amount: refundType === "partial" ? parsedAmount : undefined,
        reason: normalizedReason,
      }).unwrap();
      toast.success(
        refundType === "full"
          ? "Reembolso total procesado"
          : "Reembolso parcial procesado",
      );
      closeRefundModal();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err as Parameters<typeof getApiErrorMessage>[0]) ??
          "No se pudo procesar el reembolso",
      );
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

  const getPaymentPresentation = (currentOrder: Order) => {
    if (
      currentOrder.refundStatus === "full" ||
      currentOrder.paymentStatus === "refunded"
    ) {
      return {
        label: "Reembolsado",
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
      };
    }

    if (currentOrder.refundStatus === "partial") {
      return {
        label: "Reembolso parcial",
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
      };
    }

    if (currentOrder.paymentStatus === "paid") {
      return {
        label: "Pagado",
        color: "text-green-700",
        bg: "bg-green-50",
        border: "border-green-200",
      };
    }

    if (currentOrder.paymentStatus === "failed") {
      return {
        label: "Fallido",
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
      };
    }

    return {
      label: "Pendiente",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    };
  };

  const getRefundRecordPresentation = (refund: OrderRefund) => {
    if (refund.status === "failed") {
      return {
        label: "Fallido",
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
      };
    }

    if (refund.status === "processing") {
      return {
        label: "Procesando",
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
      };
    }

    if (refund.summaryStatus === "full") {
      return {
        label: "Total",
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
      };
    }

    return {
      label: "Parcial",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    };
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
          <div className="flex min-h-[480px] flex-col items-center justify-center py-20">
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

  const effectiveStatus = isFullyRefunded ? "cancelled" : order.status;
  const currentStatus =
    statusConfig[effectiveStatus as OrderStatus] || statusConfig.pending;
  const paymentPresentation = getPaymentPresentation(order);
  const StatusIcon = currentStatus.icon;
  const isCancelledFinal = effectiveStatus === "cancelled";
  const cancellationReason = order.notes?.trim();
  const lockedCardTone = isCancelledFinal
    ? {
        container: "border-red-200 bg-red-50/70",
        iconWrap: "border-red-200 bg-white text-red-700",
      }
    : {
        container: "border-emerald-200 bg-emerald-50/70",
        iconWrap: "border-emerald-200 bg-white text-emerald-700",
      };

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
                  <div
                    className={`mt-3 rounded-xl border px-3 py-3 text-sm ${paymentPresentation.bg} ${paymentPresentation.border}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-black/60">Método</span>
                      <span className="font-medium text-black/80">
                        {order.paymentMethod === "card"
                          ? "Tarjeta"
                          : order.paymentMethod === "cash"
                            ? "Efectivo"
                            : "Transferencia"}
                      </span>
                    </div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-black/60">Estado</span>
                      <span className={`font-semibold ${paymentPresentation.color}`}>
                        {paymentPresentation.label}
                      </span>
                    </div>
                    {refundedAmount > 0 && (
                      <>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-black/60">Reembolsado</span>
                          <span className="font-medium text-black/80">
                            {formatPrice(refundedAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-black/60">Restante</span>
                          <span className="font-medium text-black/80">
                            {formatPrice(remainingRefundableAmount)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Refund History */}
            {order.refunds && order.refunds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.23 }}
                className="overflow-hidden rounded-2xl border border-black/10 bg-white"
              >
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <RotateCcw size={18} className="text-black/70" />
                    <h2 className="font-semibold">Historial de reembolsos</h2>
                  </div>
                </div>
                <div className="divide-y divide-black/5">
                  {order.refunds.map((refund) => {
                    const refundPresentation = getRefundRecordPresentation(refund);

                    return (
                      <div key={refund.id} className="space-y-3 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${refundPresentation.bg} ${refundPresentation.border} ${refundPresentation.color}`}
                              >
                                {refundPresentation.label}
                              </span>
                              <span className="text-xs uppercase tracking-[0.16em] text-black/45">
                                {refund.type === "full"
                                  ? "Reembolso total"
                                  : "Reembolso parcial"}
                              </span>
                            </div>
                            <p className="text-sm text-black/65">
                              {refund.reason}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-lg font-semibold">
                              {formatPrice(
                                refund.processedAmount || refund.requestedAmount,
                              )}
                            </p>
                            <p className="text-xs text-black/50">
                              {formatDate(
                                refund.refundedAt ??
                                  refund.updatedAt ??
                                  refund.createdAt,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-2 text-xs text-black/55 sm:grid-cols-3">
                          <p>
                            Admin:{" "}
                            <span className="font-medium text-black/75">
                              {refund.requestedByAdminUsername ||
                                refund.requestedByAdminId}
                            </span>
                          </p>
                          <p>
                            Estado técnico:{" "}
                            <span className="font-medium text-black/75">
                              {refund.processorStatus || refund.status}
                            </span>
                          </p>
                          {refund.mpRefundId && (
                            <p>
                              Refund ID:{" "}
                              <span className="font-medium text-black/75">
                                {refund.mpRefundId}
                              </span>
                            </p>
                          )}
                        </div>

                        {refund.errorMessage && (
                          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            {refund.errorMessage}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

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
                  <p className="text-xs text-black/50">
                    Nuestros productos ya incluyen el IVA.
                  </p>
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

            {/* Refunds */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
              <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                <h3 className="font-semibold">Reembolsos</h3>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-black/60">Monto pagado</span>
                    <span className="font-semibold">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-black/60">Reembolsado</span>
                    <span className="font-semibold">
                      {formatPrice(refundedAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-black/60">Disponible</span>
                    <span className="font-semibold">
                      {formatPrice(remainingRefundableAmount)}
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    canRefund
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-black/10 bg-black/[0.03] text-black/60"
                  }`}
                >
                  {canRefund
                    ? "Puedes procesar un reembolso total o parcial desde este panel."
                    : isDeliveredOrder
                      ? "Los pedidos entregados ya no permiten crear reembolsos."
                      : !order.mpPaymentId
                      ? "Este pedido no tiene un mpPaymentId asociado."
                      : order.paymentStatus !== "paid"
                        ? "Solo se pueden reembolsar pagos aprobados."
                        : "Ya no queda monto disponible para reembolsar."}
                </div>

                {canRefund && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    disabled={isRefunding}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/40"
                  >
                    <Wallet size={16} />
                    {isRefunding ? "Procesando..." : "Reembolsar pago"}
                  </button>
                )}
              </div>
            </div>

            {/* Update Status */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
              <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                <h3 className="font-semibold">
                  {isStatusLocked ? "Estado final" : "Actualizar estado"}
                </h3>
              </div>
              <div className="p-4">
                {isStatusLocked ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative overflow-hidden rounded-2xl border p-4 ${lockedCardTone.container}`}
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/40" />
                    <div className="relative space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${lockedCardTone.iconWrap}`}
                        >
                          <StatusIcon size={20} />
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">
                            Pedido cerrado
                          </p>
                          <p className="text-base font-semibold text-black/85">
                            {currentStatus.label}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-black/65">
                        {isCancelledFinal
                          ? "Este pedido fue cancelado y ya no permite cambios manuales."
                          : "Este pedido llegó a un estado final y por seguridad ya no permite cambios manuales."}
                      </p>

                      {isCancelledFinal && (
                        <>
                          <button
                            onClick={() => setShowLockedStatusInfo((prev) => !prev)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-black/70 transition hover:text-black"
                          >
                            {showLockedStatusInfo ? (
                              <>
                                Ocultar detalle
                                <ChevronUp size={14} />
                              </>
                            ) : (
                              <>
                                Ver detalle
                                <ChevronDown size={14} />
                              </>
                            )}
                          </button>

                          <AnimatePresence initial={false}>
                            {showLockedStatusInfo && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs text-black/70">
                                  <p className="mb-1 font-semibold text-black/80">
                                    Motivo de cancelación
                                  </p>
                                  <p>
                                    {cancellationReason &&
                                    cancellationReason.length > 0
                                      ? cancellationReason
                                      : "No se registró un motivo de cancelación."}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  </motion.div>
                ) : (
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
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Refund Modal */}
        <AnimatePresence>
          {showRefundModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={closeRefundModal}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4"
              >
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                  <div className="border-b border-black/10 px-6 py-5">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/5">
                      <RotateCcw size={22} className="text-black/80" />
                    </div>
                    <h3 className="text-xl font-semibold">Reembolsar pago</h3>
                    <p className="mt-1 text-sm text-black/60">
                      Disponible para reembolso:{" "}
                      <span className="font-semibold text-black/80">
                        {formatPrice(remainingRefundableAmount)}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-5 px-6 py-5">
                    <div className="grid grid-cols-2 gap-2">
                      {(["full", "partial"] as OrderRefundType[]).map((type) => {
                        const active = refundType === type;
                        return (
                          <button
                            key={type}
                            onClick={() => setRefundType(type)}
                            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                              active
                                ? "border-black bg-black text-white"
                                : "border-black/10 bg-white text-black/70 hover:bg-black/5"
                            }`}
                          >
                            <p className="font-semibold">
                              {type === "full"
                                ? "Reembolso total"
                                : "Reembolso parcial"}
                            </p>
                            <p
                              className={`mt-1 text-xs ${
                                active ? "text-white/70" : "text-black/45"
                              }`}
                            >
                              {type === "full"
                                ? "Devuelve el monto restante completo"
                                : "Devuelve solo una parte del monto"}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {refundType === "partial" && (
                      <div>
                        <label
                          htmlFor="refund-amount"
                          className="mb-2 block text-sm font-medium text-black/75"
                        >
                          Monto a reembolsar
                        </label>
                        <input
                          id="refund-amount"
                          type="number"
                          inputMode="decimal"
                          min="0.01"
                          step="0.01"
                          max={remainingRefundableAmount.toFixed(2)}
                          value={refundAmount}
                          onChange={(event) => setRefundAmount(event.target.value)}
                          className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/30"
                          placeholder="0.00"
                        />
                        <p className="mt-2 text-xs text-black/50">
                          Máximo disponible:{" "}
                          {formatPrice(remainingRefundableAmount)}
                        </p>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="refund-reason"
                        className="mb-2 block text-sm font-medium text-black/75"
                      >
                        Motivo
                      </label>
                      <textarea
                        id="refund-reason"
                        rows={4}
                        value={refundReason}
                        onChange={(event) => setRefundReason(event.target.value)}
                        className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/30"
                        placeholder="Describe por qué se autoriza este reembolso"
                      />
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                      Esta acción llama a Mercado Pago desde el backend y queda
                      registrada en el historial del pedido.
                    </div>
                  </div>

                  <div className="flex border-t border-black/10">
                    <button
                      onClick={closeRefundModal}
                      className="flex-1 border-r border-black/10 py-3 font-medium text-black/70 transition hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleRefund}
                      disabled={
                        isRefunding ||
                        !refundReason.trim() ||
                        (refundType === "partial" &&
                          (!Number.isFinite(Number(refundAmount)) ||
                            Number(refundAmount) <= 0 ||
                            Number(refundAmount) > remainingRefundableAmount))
                      }
                      className="flex-1 py-3 font-semibold text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:text-black/30"
                    >
                      {isRefunding ? "Procesando..." : "Confirmar reembolso"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
      </div>
    </main>
  );
}
