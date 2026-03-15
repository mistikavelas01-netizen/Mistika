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
import {
  EXPRESS_SHIPPING_METHOD,
  OUTSIDE_XALAPA_SHIPPING_COST,
  XALAPA_SHIPPING_COST,
  getShippingCostForPostalCode,
  getShippingZoneLabelForPostalCode,
  isCompletePostalCode,
  normalizePostalCode,
} from "@/lib/shipping";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";

type Props = {
  totalPrice: number;
  onClose: () => void;
};

const MERCADO_PAGO_ALLOWED_HOSTS = [
  "mercadopago.com",
  "mercadopago.com.mx",
];
const FREE_SHIPPING_ENABLED = process.env.NEXT_PUBLIC_FREE_SHIPPING_ENABLED === "true";
const MIN_PURCHASE_AMOUNT = 5;

function isTrustedMercadoPagoUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();
    return MERCADO_PAGO_ALLOWED_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

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
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "shippingZip" ? normalizePostalCode(value) : value,
    }));
  };

  const hasCompleteShippingZip = isCompletePostalCode(formData.shippingZip);
  const shippingCost = FREE_SHIPPING_ENABLED
    ? 0
    : getShippingCostForPostalCode(formData.shippingZip);
  const summaryShippingCost = FREE_SHIPPING_ENABLED
    ? 0
    : hasCompleteShippingZip
      ? shippingCost
      : XALAPA_SHIPPING_COST;
  const shippingZoneLabel = hasCompleteShippingZip
    ? getShippingZoneLabelForPostalCode(formData.shippingZip)
    : null;
  const totalAmount = totalPrice + summaryShippingCost;
  const isBelowMinimum = totalAmount < MIN_PURCHASE_AMOUNT;
  const navigateToCartFallback = () => {
    onClose();
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/cart"
    ) {
      router.replace("/cart?checkout=error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRedirecting) return;
    if (isBelowMinimum) {
      toast.error(`La compra mínima es de $${MIN_PURCHASE_AMOUNT} MXN.`);
      return;
    }

    try {
      const normalizedCustomerName = formData.customerName.trim();
      const normalizedCustomerEmail = formData.customerEmail.trim().toLowerCase();
      const normalizedCustomerPhone = formData.customerPhone.trim();
      const normalizedShippingStreet = formData.shippingStreet.trim();
      const normalizedShippingCity = formData.shippingCity.trim();
      const normalizedShippingState = formData.shippingState.trim();
      const normalizedShippingZip = normalizePostalCode(formData.shippingZip);
      const normalizedNotes = formData.notes.trim();

      const orderData: OrderInput = {
        customerName: normalizedCustomerName,
        customerEmail: normalizedCustomerEmail,
        customerPhone: normalizedCustomerPhone,
        shippingAddress: {
          street: normalizedShippingStreet,
          city: normalizedShippingCity,
          state: normalizedShippingState,
          zip: normalizedShippingZip,
          country: "México",
        },
        shippingMethod: EXPRESS_SHIPPING_METHOD,
        paymentMethod: "card",
        notes: normalizedNotes || undefined,
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
            payer: { email: normalizedCustomerEmail, name: normalizedCustomerName },
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
            if (!isTrustedMercadoPagoUrl(initPoint)) {
              throw new Error("La URL de pago recibida no es válida.");
            }
            const isSandboxUrl = initPoint.includes("mercadopago");
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
            window.location.replace(initPoint);
            return;
          }
        } catch (prefError) {
          console.warn("[Checkout] Mercado Pago preference failed:", prefError);
          const message = getApiErrorMessage(
            prefError as Parameters<typeof getApiErrorMessage>[0]
          );
          toast.error(message || "No se pudo conectar con Mercado Pago. Intenta de nuevo.");
          setIsRedirecting(false);
          navigateToCartFallback();
          return;
        }

        toast.error("No se pudo generar el enlace de pago. Intenta de nuevo.");
        setIsRedirecting(false);
        navigateToCartFallback();
      }
    } catch (error) {
      const message = getApiErrorMessage(error as Parameters<typeof getApiErrorMessage>[0]);
      toast.error(message || "Error al crear el pedido");
    }
  };

  const isLoadingOrRedirecting = isCreatingDraft || isCreatingPreference || isRedirecting;
  const isSubmitDisabled = isLoadingOrRedirecting || isBelowMinimum;

  // Mismo modal, solo cambia el contenido: sin overlay que se superponga
  if (isRedirecting) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12 px-4">
        <Loader2 size={40} className="animate-spin text-blue-600" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-black/80">Redirigiendo a Mercado Pago…</p>
        <p className="mt-1 text-xs text-black/50">No cierres esta ventana</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                  Teléfono *
                </div>
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                required
                placeholder="Tu teléfono"
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
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              placeholder="00000"
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <p className="mt-1.5 text-xs text-black/50">
              Validamos el código postal contra el catálogo local de Xalapa. Si
              el CP no aparece, se cobra como externo.
            </p>
            {!FREE_SHIPPING_ENABLED && hasCompleteShippingZip ? (
              <p className="mt-1.5 text-xs font-medium text-black/70">
                Zona detectada: {shippingZoneLabel} · ${shippingCost.toFixed(2)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Shipping Method */}
      <div className="overflow-hidden rounded-xl border border-black/10">
        <div className="flex items-center gap-3 border-b border-black/10 bg-black/5 px-4 py-3">
          <Truck size={16} className="text-black/60" />
          <span className="text-sm font-semibold">Método de envío</span>
        </div>
        <div className="p-4">
          <div className="rounded-lg border border-black/10 bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-black">
                  Express
                </p>
                <p className="mt-1 text-sm text-black/70">
                  Entrega de 1 a 3 días hábiles.
                </p>
              </div>
              <span className="text-sm font-semibold text-black">
                {FREE_SHIPPING_ENABLED
                  ? "$0.00"
                  : hasCompleteShippingZip
                    ? `$${shippingCost.toFixed(2)}`
                    : `$${XALAPA_SHIPPING_COST.toFixed(2)} - $${OUTSIDE_XALAPA_SHIPPING_COST.toFixed(2)}`}
              </span>
            </div>
            <p className="mt-3 text-xs text-black/60">
              El costo se define por código postal: CP de Xalapa $40.00 y CP
              externo $70.00.
            </p>
            {!FREE_SHIPPING_ENABLED && hasCompleteShippingZip ? (
              <p className="mt-2 text-xs font-medium text-black/75">
                Aplicando tarifa de {shippingZoneLabel}.
              </p>
            ) : null}
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
              <span className="font-medium">
                {FREE_SHIPPING_ENABLED
                  ? "$0.00"
                  : hasCompleteShippingZip
                    ? `$${shippingCost.toFixed(2)}`
                    : `$${XALAPA_SHIPPING_COST.toFixed(2)} - $${OUTSIDE_XALAPA_SHIPPING_COST.toFixed(2)}`}
              </span>
            </div>
            {!FREE_SHIPPING_ENABLED && !hasCompleteShippingZip ? (
              <p className="text-xs text-black/50">
                Captura un código postal válido para confirmar si aplica tarifa
                de Xalapa o externa.
              </p>
            ) : null}
            <p className="text-xs align-center text-black/50">Nuestros productos ya incluyen el IVA.</p>
            <div className="border-t border-black/10 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {FREE_SHIPPING_ENABLED || hasCompleteShippingZip
                    ? "Total a pagar"
                    : "Total desde"}
                </span>
                <span className="text-xl font-bold">
                  ${totalAmount.toFixed(2)} MXN
                </span>
              </div>
            </div>
            {isBelowMinimum ? (
              <p className="text-xs font-medium text-red-600">
                La compra mínima es de ${MIN_PURCHASE_AMOUNT} MXN.
              </p>
            ) : null}
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
          disabled={isSubmitDisabled}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoadingOrRedirecting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {isRedirecting ? "Redirigiendo…" : "Procesando…"}
            </>
          ) : isBelowMinimum ? (
            <>Compra mínima $5 MXN</>
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
