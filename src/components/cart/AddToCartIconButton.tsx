"use client";

import { useToast } from "@/hooks/useToast";

type Props = ProductCardProps;

export function AddToCartIconButton({ id, name, price, imageUrl }: Props) {
  const { showToast } = useToast();

  return (
    <button
      type="button"
      aria-label={`Agregar ${name} al carrito`}
      title="Agregar al carrito"
      className="button-86"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        // TODO: Implement cart functionality with RTK Query
        showToast({
          title: "Agregado al carrito",
          description: name,
        });
      }}
    >
      +
    </button>
  );
}
 