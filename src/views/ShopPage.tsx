"use client";

import Link from "next/link";
import { AddToCartIconButton } from "@/components/cart/AddToCartIconButton";
import ProductCarousel from "@/components/shop/ProductCarousel";
import { useFetchProductsQuery } from "@/store/features/products/productsApi";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";

export function ShopPage() {
  const { data: productsData, isLoading: isLoadingProducts, isError: isErrorProducts, error: errorProducts } = useFetchProductsQuery(undefined, { skip: false });
  const products: Product[] = productsData?.data || [];

  const errorMessage = getApiErrorMessage(errorProducts);

  useEffect(() => {
    if (isErrorProducts && errorMessage) {
      toast.error(errorMessage);
    }
  }, [isErrorProducts, errorMessage]);

  if (isLoadingProducts) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-neutral-600">Cargando productos...</p>
      </main>
    );
  }

  if (isErrorProducts) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-neutral-600">
          {errorMessage ?? "No se pudieron cargar los productos."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10">
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
        <ProductCarousel />
      </div>

      <div className="relative mb-10 pt-10">
        <div className="absolute right-0 top-4">
          <Link
            href="/cart"
            className="rounded-full bg-black px-7 py-3 text-base font-medium text-white hover:opacity-90"
          >
            Ver carrito
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-[0.25em]">MISTIKA</h1>

          <h3 className="mx-auto mt-3 max-w-xl text-sm text-neutral-900">
            Aromas que abrazan tu espacio: velas y rituales que convierten lo
            cotidiano en magia.
          </h3>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <div className="col-span-full text-center text-neutral-600">
            No hay productos disponibles
          </div>
        ) : (
          products.map((p: Product, index: number) => {
            const stock = Number(p.stock ?? 0);
            const isInactive = !p.isActive;
            const isAvailable = !isInactive && stock > 0;
            const stockLabel = isInactive
              ? "No disponible"
              : stock > 0
                ? `${stock} ${stock === 1 ? "disponible" : "disponibles"}`
                : "Agotado";
            const stockTone = isInactive
              ? "border-black/10 bg-white text-black/40"
              : isAvailable
                ? "border-black/20 bg-black/5 text-black/70"
                : "border-black/10 bg-black/5 text-black/50";
            const stockDot = isInactive
              ? "bg-black/30"
              : isAvailable
                ? "bg-black"
                : "bg-black/40";
            const priceLabel = p.price?.toString() ?? "—";

            return (
              <Link
                key={p.id}
                href={`/shop/${p.id}`}
                className="group relative overflow-hidden rounded-[30px] border border-black/10 bg-white p-4 text-black shadow-[0_16px_36px_rgba(0,0,0,0.08)] card-reveal"
                style={{
                  animationDelay: `${index * 70}ms`,
                }}
              >
                <div className="pointer-events-none absolute -left-14 top-6 h-28 w-28 rounded-full bg-black/5 blur-2xl transition-transform duration-700 group-hover:translate-y-2" />
                <div className="pointer-events-none absolute -right-10 bottom-8 h-24 w-24 rounded-full bg-black/5 blur-2xl transition-transform duration-700 group-hover:-translate-y-2" />

                <div className="relative flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="max-w-[150px] truncate rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-black/80 backdrop-blur-sm">
                      {p.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${stockTone}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${stockDot}`} />
                        {stockLabel}
                      </span>
                      <AddToCartIconButton
                        id={p.id}
                        name={p.name}
                        price={p.price?.toString() ?? 0}
                        imageUrl={p.imageUrl ?? null}
                      />
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-black/5">
                    <div
                      className="pointer-events-none absolute inset-0 opacity-90"
                      style={{
                        background:
                          "radial-gradient(120% 80% at 20% 10%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.1) 45%, transparent 70%), linear-gradient(160deg, rgba(255,255,255,0.12), rgba(0,0,0,0.05))",
                      }}
                    />

                    <div className="relative aspect-[4/5]">
                      <div
                        className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.06] ${
                          isAvailable ? "" : "grayscale"
                        }`}
                        style={{
                          backgroundImage: `url(${p.imageUrl ?? "/images/products/placeholder.jpg"})`,
                        }}
                      />

                      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
                        <div className="rounded-full border border-black/10 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-black/60">
                          MXN
                        </div>
                        <div className="rounded-full bg-black px-3 py-1 text-sm font-semibold text-white">
                          $ {priceLabel}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold tracking-[0.05em]">
                        {p.name}
                      </h2>
                      {p.description ? (
                        <p className="mt-1 text-sm text-black/60 line-clamp-2">
                          {p.description}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-black/60">
                          Sin descripción por el momento.
                        </p>
                      )}
                    </div>

                    <div className="text-right text-[10px] uppercase tracking-[0.35em] text-black/50">
                      Aroma
                      <span className="mt-1 block text-xs font-semibold tracking-[0.1em] text-black">
                        Mistika
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
