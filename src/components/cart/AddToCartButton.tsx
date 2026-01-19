"use client";

import { useCart } from "@/context/cart-context";

type Props = {
  name: string;
  price: number | string;
  image?: string | null;
  id?: number | string;
};

export function AddToCartButton({ name, price, image, id }: Props) {
  const { addToCart } = useCart();

  return (
    <button
      onClick={() => addToCart({ id, name, price, image })}
      className="mt-6 w-full rounded-2xl bg-black px-5 py-3 text-white hover:opacity-90"
    >
      Agregar al carrito
    </button>
  );
}
