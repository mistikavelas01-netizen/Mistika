"use client";

import Link from "next/link";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart, totalPrice, totalQty } = useCart();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Carrito</h1>
          <p className="mt-2 text-neutral-600">{totalQty} artículos</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearCart}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Vaciar
          </button>
          <Link href="/shop" className="rounded-xl bg-black px-4 py-2 text-sm text-white">
            Seguir comprando
          </Link>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="mt-10 rounded-2xl border p-6 text-neutral-600">
          Tu carrito está vacío.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {cart.map((it) => (
            <div key={it.name} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{it.name}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    ${it.priceNumber.toFixed(2)} MXN
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) => updateQty(it.name, Number(e.target.value))}
                    className="w-20 rounded-xl border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => removeFromCart(it.name)}
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border p-5">
            <div className="flex items-center justify-between">
              <p className="text-neutral-600">Total</p>
              <p className="text-xl font-semibold">${totalPrice.toFixed(2)} MXN</p>
            </div>

            <button className="mt-4 w-full rounded-2xl bg-black px-5 py-3 text-white hover:opacity-90">
              Ir a pagar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
