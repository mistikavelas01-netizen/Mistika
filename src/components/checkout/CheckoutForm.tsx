"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Truck,
  CreditCard,
  Shield,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { useCreateCheckoutDraftMutation, useCreateMercadoPagoPreferenceMutation } from "@/store/features/orders/ordersApi";
import { useCart } from "@/context/cart-context";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";

type Props = {
  totalPrice: number;
  onClose: () => void;
};

const shippingOptions = [
  {
    value: "standard",
    label: "Estándar",
    days: "5-7 días hábiles",
    cost: 150,
  },
  {
    value: "express",
    label: "Express",
    days: "2-3 días hábiles",
    cost: 250,
  },
] as const;

export function CheckoutForm({ totalPrice, onClose }: Props) {
  const router = useRouter();
  const { cart } = useCart();
  const [createDraft, { isLoading: isCreatingDraft }] = useCreateCheckoutDraftMutation();
  const [createPreference, { isLoading: isCreatingPreference }] =
    useCreateMercadoPagoPreferenceMutation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingStreet: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    shippingCountry: "México",
    shippingMethod: "standard" as "standard" | "express",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const shippingCost =
    totalPrice >= 500
      ? 0
      : shippingOptions.find((o) => o.value === formData.shippingMethod)?.cost || 150;
  const tax = totalPrice * 0.16;
  const totalAmount = totalPrice + shippingCost + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRedirecting) return;

    try {
      const orderData: OrderInput = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || undefined,
        shippingAddress: {
          street: formData.shippingStreet,
          city: formData.shippingCity,
          state: formData.shippingState,
          zip: formData.shippingZip,
          country: formData.shippingCountry,
        },
        shippingMethod: formData.shippingMethod,
        paymentMethod: "card",
        notes: formData.notes || undefined,
        items: cart.map((item) => ({
          productId: item.id ?? "",
          quantity: item.quantity || 1,
          unitPrice: item.priceNumber || 0,
          productName: item.name,
        })),
      };

      const draftResult = await createDraft(orderData).unwrap();

      if (draftResult.success && draftResult.data?.id) {
        const draftId = draftResult.data.id;
        setIsRedirecting(true);

        try {
          const prefResult = await createPreference({
            draftId,
            payer: { email: formData.customerEmail, name: formData.customerName },
          }).unwrap();

          const forceSandbox = typeof window !== "undefined" && process.env.NEXT_PUBLIC_MERCADOPAGO_USE_SANDBOX === "true";
          const isLocalhost =
            typeof window !== "undefined" &&
            (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
          const useSandbox = forceSandbox || isLocalhost;
          const initPoint = useSandbox
            ? prefResult?.data?.sandbox_init_point ?? prefResult?.data?.init_point
            : prefResult?.data?.init_point ?? prefResult?.data?.sandbox_init_point;

          if (initPoint) {
            const isSandboxUrl = initPoint.includes("sandbox.mercadopago");
            if (typeof console !== "undefined" && console.info) {
              console.info(
                "[Checkout] Redirigiendo a Mercado Pago:",
                isSandboxUrl ? "SANDBOX (pruebas)" : "PRODUCCIÓN",
                initPoint.substring(0, 60) + "..."
              );
            }
            if (!isSandboxUrl && useSandbox) {
              console.warn(
                "[Checkout] Queríamos sandbox pero la API no devolvió sandbox_init_point. Revisa MERCADOPAGO_ACCESS_TOKEN (Credenciales de prueba)."
              );
            }
            toast.success("Redirigiendo a Mercado Pago…");
            window.location.assign(initPoint);
            return;
          }
        } catch (prefError) {
          console.warn("[Checkout] Mercado Pago preference failed:", prefError);
          toast.error("No se pudo conectar con Mercado Pago. Intenta de nuevo.");
          setIsRedirecting(false);
        }

        router.push("/cart");
      }
    } catch (error) {
      const message = getApiErrorMessage(error as Parameters<typeof getApiErrorMessage>[0]);
      toast.error(message || "Error al crear el pedido");
    }
  };

  const isLoadingOrRedirecting = isCreatingDraft || isCreatingPreference || isRedirecting;

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6">
      {/* Overlay: no vaciar carrito; mostrar "Redirigiendo..." hasta que se haga el redirect */}
      {isRedirecting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/95 backdrop-blur-sm">
          <Loader2 size={40} className="animate-spin text-blue-600" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium text-black/80">Redirigiendo a Mercado Pago…</p>
          <p className="mt-1 text-xs text-black/50">No cierres esta ventana</p>
        </div>
      )}
      {/* Contact Information */}
      <div className="overflow-hidden rounded-xl border border-black/10">
        <div className="flex items-center gap-3 border-b border-black/10 bg-black/5 px-4 py-3">
          <User size={16} className="text-black/60" />
          <span className="text-sm font-semibold">Datos de contacto</span>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-black/70">
              Nombre completo *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              placeholder="Tu nombre"
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black/70">
                <div className="flex items-center gap-1.5">
                  <Mail size={14} />
                  Email *
                </div>
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black/70">
                <div className="flex items-center gap-1.5">
                  <Phone size={14} />
                  Teléfono
                </div>
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                placeholder="(opcional)"
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="overflow-hidden rounded-xl border border-black/10">
        <div className="flex items-center gap-3 border-b border-black/10 bg-black/5 px-4 py-3">
          <MapPin size={16} className="text-black/60" />
          <span className="text-sm font-semibold">Dirección de envío</span>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-black/70">
              Calle y número *
            </label>
            <input
              type="text"
              name="shippingStreet"
              value={formData.shippingStreet}
              onChange={handleChange}
              required
              placeholder="Av. Principal #123, Col. Centro"
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black/70">
                Ciudad *
              </label>
              <input
                type="text"
                name="shippingCity"
                value={formData.shippingCity}
                onChange={handleChange}
                required
                placeholder="Ciudad"
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black/70">
                Estado *
              </label>
              <input
                type="text"
                name="shippingState"
                value={formData.shippingState}
                onChange={handleChange}
                required
                placeholder="Estado"
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black/70">
                Código postal *
              </label>
              <input
                type="text"
                name="shippingZip"
                value={formData.shippingZip}
                onChange={handleChange}
                required
                placeholder="00000"
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black/70">
                País *
              </label>
              <input
                type="text"
                name="shippingCountry"
                value={formData.shippingCountry}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Method */}
      <div className="overflow-hidden rounded-xl border border-black/10">
        <div className="flex items-center gap-3 border-b border-black/10 bg-black/5 px-4 py-3">
          <Truck size={16} className="text-black/60" />
          <span className="text-sm font-semibold">Método de envío</span>
          {totalPrice >= 500 && (
            <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              ¡Envío gratis!
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {shippingOptions.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                  formData.shippingMethod === option.value
                    ? "border-black bg-black/5"
                    : "border-black/10 hover:bg-black/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={option.value}
                    checked={formData.shippingMethod === option.value}
                    onChange={handleChange}
                    className="h-4 w-4 accent-black"
                  />
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-black/50">{option.days}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold">
                  {totalPrice >= 500 ? (
                    <span className="text-green-600">Gratis</span>
                  ) : (
                    `$${option.cost}`
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="overflow-hidden rounded-xl border border-black/10">
        <div className="flex items-center gap-3 border-b border-black/10 bg-black/5 px-4 py-3">
          <FileText size={16} className="text-black/60" />
          <span className="text-sm font-semibold">Notas (opcional)</span>
        </div>
        <div className="p-4">
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Instrucciones especiales para la entrega..."
            className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-black/5">
        <div className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-black/60">Subtotal</span>
              <span className="font-medium">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Envío</span>
              {shippingCost === 0 ? (
                <span className="font-medium text-green-600">Gratis</span>
              ) : (
                <span className="font-medium">${shippingCost.toFixed(2)}</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">IVA (16%)</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-black/10 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total a pagar</span>
                <span className="text-xl font-bold">${totalAmount.toFixed(2)} MXN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500">
            <CreditCard size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900">Pago seguro con Mercado Pago</p>
            <p className="mt-1 text-sm text-blue-700">
              Al confirmar, serás redirigido a Mercado Pago para completar tu pago con
              tarjeta de crédito o débito de forma segura.
            </p>
          </div>
        </div>
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4 text-xs text-black/50">
        <div className="flex items-center gap-1.5">
          <Shield size={14} />
          <span>Datos encriptados</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard size={14} />
          <span>Pago seguro</span>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-black/10 py-3.5 font-medium text-black/70 transition hover:bg-black/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoadingOrRedirecting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoadingOrRedirecting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {isRedirecting ? "Redirigiendo…" : "Procesando…"}
            </>
          ) : (
            <>
              Pagar con Mercado Pago
              <ExternalLink size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
