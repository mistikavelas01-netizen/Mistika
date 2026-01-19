"use client";

import { useToast } from "@/hooks/useToast";
import { useCart } from "@/context/cart-context";

type Props = ProductCardProps;

export function AddToCartIconButton({ id, name, price, imageUrl }: Props) {
  const { showToast } = useToast();
  const { addToCart } = useCart();

  return (
    <button
      type="button"
      aria-label={`Agregar ${name} al carrito`}
      title="Agregar al carrito"
      className="button-86"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        addToCart({ id, name, price, imageUrl });
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
 
