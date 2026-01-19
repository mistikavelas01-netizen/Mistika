"use client";

import { useToast } from "@/hooks/useToast";

type Props = CartItemInput;

export function AddToCartButton({ name, price, imageUrl, id }: Props) {
  const { showToast } = useToast();

  return (
    <button
      type="button"
      onClick={() => {
        // TODO: Implement cart functionality with RTK Query
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
