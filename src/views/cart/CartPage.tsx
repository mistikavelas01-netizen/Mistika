"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  CreditCard,
  Package,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/context/cart-context";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getProductImageUrl } from "@/constant";

const CHECKOUT_RETURN_TOAST_KEY = "checkout_return_toast";

export function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    totalQuantity,
  } = useCart();

  const [showClearModal, setShowClearModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(CHECKOUT_RETURN_TOAST_KEY) : null;
      if (!raw) return;
      sessionStorage.removeItem(CHECKOUT_RETURN_TOAST_KEY);
      const { type, message } = JSON.parse(raw) as { type?: "error" | "info"; message?: string };
      if (message) {
        if (type === "error") toast.error(message);
        else toast(message, { icon: "ℹ️" });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleClearCart = () => {
    clearCart();
    setShowClearModal(false);
  };

  const shippingCost = 80;
  const finalTotal = totalPrice + shippingCost;

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
            <ArrowLeft size={18} />
            <span className="uppercase tracking-[0.2em]">Seguir comprando</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[0.05em] sm:text-4xl">
                Tu carrito
              </h1>
              <p className="mt-1 text-black/60">
                {totalQuantity} {totalQuantity === 1 ? "artículo" : "artículos"}
              </p>
            </div>

            {cart.length > 0 && (
              <button
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-black/60 transition hover:bg-black/5"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Vaciar</span>
              </button>
            )}
          </div>
        </motion.div>

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-black/10 bg-white p-12 text-center"
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-black/5">
              <ShoppingBag size={40} className="text-black/30" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Tu carrito está vacío</h2>
            <p className="mb-6 text-black/60">
              Descubre nuestras velas artesanales y materiales de calidad
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <ArrowLeft size={18} />
              Explorar productos
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Products List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="divide-y divide-black/5">
                  {cart.map((item, index) => {
                    const quantity = Math.max(1, Number(item.quantity) || 1);
                    const itemTotal = (Number(item.priceNumber) || 0) * quantity;
                    const maxStock =
                      typeof item.stock === "number" && Number.isFinite(item.stock)
                        ? Math.max(0, Math.floor(item.stock))
                        : null;
                    const isMaxed =
                      maxStock !== null && maxStock > 0 && quantity >= maxStock;

                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4 p-4 sm:p-5"
                      >
                        {/* Image */}
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black/5 sm:h-28 sm:w-28">
                          <Image
                            src={getProductImageUrl(item.imageUrl)}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <h3 className="font-semibold leading-tight line-clamp-2">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-black/50">
                              ${Number(item.priceNumber || 0).toFixed(2)} c/u
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            {/* Quantity */}
                            <div className="inline-flex items-center rounded-lg border border-black/10 bg-black/5">
                              <button
                                onClick={() =>
                                  updateQuantity(item.name, Math.max(1, quantity - 1))
                                }
                                className="flex h-8 w-8 items-center justify-center text-black/60 transition hover:text-black"
                                aria-label="Reducir cantidad"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold">
                                {quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.name,
                                    isMaxed || maxStock === 0
                                      ? quantity
                                      : quantity + 1,
                                  )
                                }
                                disabled={isMaxed || maxStock === 0}
                                className="flex h-8 w-8 items-center justify-center text-black/60 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Aumentar cantidad"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Remove */}
                            <button
                              onClick={() => removeFromCart(item.name)}
                              className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-black/50 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                              <span className="hidden sm:inline">Eliminar</span>
                            </button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-lg font-bold">${itemTotal.toFixed(2)}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Benefits */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Shield, text: "Pago 100% seguro" },
                  { icon: Package, text: "Empaque ecológico" },
                ].map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl bg-black/5 px-4 py-3"
                  >
                    <benefit.icon size={18} className="shrink-0 text-black/50" />
                    <span className="text-sm text-black/70">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-8 overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <h2 className="font-semibold">Resumen del pedido</h2>
                </div>

                <div className="p-5">
                  {/* Items summary */}
                  <div className="mb-4 max-h-40 space-y-2 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate text-black/60">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="shrink-0 font-medium">
                          ${((item.priceNumber || 0) * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 border-t border-black/10 pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-black/60">Subtotal</span>
                      <span className="font-medium">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Envío</span>
                      <span className="font-medium">${shippingCost.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-black/50">Nuestros productos ya incluyen el IVA.</p>
                  </div>

                  <div className="mt-4 border-t border-black/10 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold">${finalTotal.toFixed(2)}</span>
                    </div>
                    <p className="mt-1 text-xs text-black/50">MXN, impuestos incluidos</p>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <CreditCard size={18} />
                    Continuar al pago
                  </button>

                  <p className="mt-4 text-center text-xs text-black/50">
                    Serás redirigido a Mercado Pago para completar tu compra de forma segura
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Checkout Modal */}
        <AnimatePresence>
          {showCheckout && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowCheckout(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[95vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:h-[95vh] sm:max-h-[95vh] sm:w-full sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
              >
                <div className="flex h-full max-h-[95vh] flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                    <div>
                      <h2 className="text-xl font-semibold">Finalizar compra</h2>
                      <p className="text-sm text-black/50">
                        Completa tus datos para continuar
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/60 transition hover:bg-black/5"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="flex-1 overflow-y-auto p-5">
                    <CheckoutForm
                      totalPrice={totalPrice}
                      onClose={() => setShowCheckout(false)}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Clear Cart Modal */}
        <AnimatePresence>
          {showClearModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowClearModal(false)}
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
                      <Trash2 size={28} className="text-red-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">¿Vaciar carrito?</h3>
                    <p className="text-sm text-black/60">
                      Se eliminarán todos los artículos de tu carrito.
                    </p>
                  </div>
                  <div className="flex border-t border-black/10">
                    <button
                      onClick={() => setShowClearModal(false)}
                      className="flex-1 border-r border-black/10 py-3 font-medium text-black/70 transition hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleClearCart}
                      className="flex-1 py-3 font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Vaciar
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
