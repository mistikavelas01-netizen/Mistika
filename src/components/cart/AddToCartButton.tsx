"use client";

import { useToast } from "@/hooks/useToast";
import { useCart } from "@/context/cart-context";

type Props = CartItemInput;

export function AddToCartButton({ name, price, imageUrl, id, stock }: Props) {
  const { showToast } = useToast();
  const { addToCart } = useCart();

  return (
    <button
      type="button"
      onClick={() => {
        addToCart({ id, name, price, imageUrl, stock });
        showToast({
          title: "Agregado al carrito",
          description: name,
        });
      }}
      className="mt-6 w-full rounded-2xl bg-black px-5 py-3 text-white hover:opacity-90"
    >
      Agregar al carrito
    </button>
  );
}
