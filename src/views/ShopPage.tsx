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
          products.map((p: Product) => (
            <Link
              key={p.id}
              href={`/shop/${p.id}`}
              className="group overflow-hidden rounded-2xl border hover:bg-neutral-50"
            >
              <div className="relative aspect-square w-full bg-neutral-100">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
                  style={{
                    backgroundImage: `url(${p.imageUrl ?? "/images/products/placeholder.jpg"})`,
                  }}
                />

                <div className="absolute right-3 top-3">
                  <AddToCartIconButton
                    id={p.id}
                    name={p.name}
                    price={p.price?.toString() ?? 0}
                    imageUrl={p.imageUrl ?? null}
                  />
                </div>
              </div>

              <div className="p-4">
                <h2 className="text-lg font-medium">{p.name}</h2>
                <p className="mt-1 text-neutral-600">
                  ${p.price?.toString() ?? "—"} MXN
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
