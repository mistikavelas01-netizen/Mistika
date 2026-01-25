"use client";

import { useState } from "react";
import { MapPin, Mail, CreditCard, Truck } from "lucide-react";
import { useCreateOrderMutation } from "@/store/features/orders/ordersApi";
import { useCart } from "@/context/cart-context";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type Props = {
  totalPrice: number;
  onClose: () => void;
};

type ShippingMethod = "xalapa" | "fuera";

type CheckoutFormDataLocal = Omit<CheckoutFormData, "shippingMethod"> & {
  shippingMethod: ShippingMethod;
};

export function CheckoutForm({ totalPrice, onClose }: Props) {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [createOrder, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();

  const [formData, setFormData] = useState<CheckoutFormDataLocal>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingStreet: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    shippingCountry: "México",
    useBillingAddress: false,
    shippingMethod: "xalapa",
    paymentMethod: "card",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      if (type === "checkbox") {
        return { ...prev, [name]: (e.target as HTMLInputElement).checked };
      }

      if (name === "shippingMethod") {
        return { ...prev, shippingMethod: value as ShippingMethod };
      }

      return { ...prev, [name]: value };
    });
  };

  const shippingCosts: Record<ShippingMethod, number> = {
    xalapa: 100.0,
    fuera: 180.0,
  };

  const shippingCost =
    shippingCosts[formData.shippingMethod as ShippingMethod] ?? 0;
  const tax = totalPrice * 0.16;
  const totalAmount = totalPrice + shippingCost + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        billingAddress: formData.useBillingAddress
          ? {
              street: formData.billingStreet || "",
              city: formData.billingCity || "",
              state: formData.billingState || "",
              zip: formData.billingZip || "",
              country: formData.billingCountry || formData.shippingCountry,
            }
          : undefined,
        shippingMethod: formData.shippingMethod as any,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
        items: cart.map((item) => ({
          productId: typeof item.id === "number" ? item.id : 0,
          quantity: item.quantity || 1,
          unitPrice: item.priceNumber || 0,
          productName: item.name,
        })),
      };

      const result = await createOrder(orderData).unwrap();

      if (result.success && result.data) {
        toast.success("¡Pedido creado exitosamente!");
        clearCart();
        router.push(`/orders/${result.data.orderNumber}`);
      }
    } catch (error: any) {
      toast.error(error?.data?.error || "Error al crear el pedido");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="rounded-[24px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-black/5">
            <Mail size={20} className="text-black/80" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold tracking-[0.05em]">
            Información del cliente
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-black/80">
              Nombre completo *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black/80">
                Email *
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black/80">
                Teléfono
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="rounded-[24px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-black/5">
            <MapPin size={20} className="text-black/80" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold tracking-[0.05em]">
            Dirección de envío
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-black/80">
              Calle y número *
            </label>
            <input
              type="text"
              name="shippingStreet"
              value={formData.shippingStreet}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black/80">
                Ciudad *
              </label>
              <input
                type="text"
                name="shippingCity"
                value={formData.shippingCity}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black/80">
                Estado *
              </label>
              <input
                type="text"
                name="shippingState"
                value={formData.shippingState}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black/80">
                Código postal *
              </label>
              <input
                type="text"
                name="shippingZip"
                value={formData.shippingZip}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black/80">
                País *
              </label>
              <input
                type="text"
                name="shippingCountry"
                value={formData.shippingCountry}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Method */}
      <div className="rounded-[24px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-black/5">
            <Truck size={20} className="text-black/80" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold tracking-[0.05em]">
            Método de envío
          </h3>
        </div>

        <div className="space-y-3">
          {[
            { value: "xalapa" as const, label: "En Xalapa", cost: 100 },
            { value: "fuera" as const, label: "Fuera de Xalapa", cost: 180 },
          ].map((method) => (
            <label
              key={method.value}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                formData.shippingMethod === method.value
                  ? "border-black bg-black/5"
                  : "border-black/10 bg-white hover:bg-black/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.value}
                  checked={formData.shippingMethod === method.value}
                  onChange={handleChange}
                  className="h-4 w-4 border-black/20 text-black focus:ring-2 focus:ring-black/20"
                />
                <p className="font-semibold">{method.label}</p>
              </div>
              <p className="font-bold">${method.cost.toFixed(2)} MXN</p>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-[24px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-black/5">
            <CreditCard
              size={20}
              className="text-black/80"
              aria-hidden="true"
            />
          </div>
          <h3 className="text-lg font-semibold tracking-[0.05em]">
            Método de pago
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {(["card", "cash", "transfer"] as const).map((method) => (
            <label
              key={method}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-4 transition ${
                formData.paymentMethod === method
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white hover:bg-black/5"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={formData.paymentMethod === method}
                onChange={handleChange}
                className="h-4 w-4 border-black/20 text-black focus:ring-2 focus:ring-black/20"
              />
              <span className="text-sm font-semibold uppercase tracking-[0.1em]">
                {method === "card"
                  ? "Tarjeta"
                  : method === "cash"
                    ? "Efectivo"
                    : "Transferencia"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-[24px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
        <h3 className="mb-4 text-lg font-semibold tracking-[0.05em]">
          Resumen del pedido
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-black/60">Subtotal</span>
            <span className="font-semibold">${totalPrice.toFixed(2)} MXN</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-black/60">Envío</span>
            <span className="font-semibold">
              ${shippingCost.toFixed(2)} MXN
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-black/60">IVA (16%)</span>
            <span className="font-semibold">${tax.toFixed(2)} MXN</span>
          </div>
          <div className="border-t border-black/10 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-[0.1em]">
                Total
              </span>
              <span className="text-2xl font-bold">
                ${totalAmount.toFixed(2)} MXN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-black/10 bg-white px-6 py-4 font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-black/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isCreatingOrder}
          className="flex-1 rounded-xl bg-black px-6 py-4 font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreatingOrder ? "Procesando..." : "Confirmar pedido"}
        </button>
      </div>
    </form>
  );
}
