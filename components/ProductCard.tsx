"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartIconButton } from "@/components/cart/AddToCartIconButton";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const priceLabel = product.price?.toString() ?? "—";
  const imageUrl = product.imageUrl || ""

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-transform duration-500 hover:-translate-y-1">
      <Link
        href={`/${product.id}`}
        className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-black/10 bg-black/5"
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 90vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        
        {/* Add to cart button overlay */}
        <div className="absolute right-3 top-3 z-10">
          <AddToCartIconButton
            id={product.id}
            name={product.name}
            price={product.price?.toString() ?? "0"}
            imageUrl={product.imageUrl ?? null}
          />
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
        <Link href={`/${product.id}`} className="group/link">
          <h3 className="text-lg font-semibold leading-snug line-clamp-2 transition-colors group-hover/link:text-black/80">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-black/60">${priceLabel} MXN</p>
        </Link>

        <Link
          href={`/${product.id}`}
          className="inline-flex w-full items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
          aria-label={`Ver detalles de ${product.name}`}
        >
          Ver más
        </Link>
      </div>
    </article>
  );
}
