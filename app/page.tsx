"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowDown, ShoppingBag } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductCarousel from "@/components/shop/ProductCarousel";
import { useFetchProductsQuery } from "@/store/features/products/productsApi";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";
import { useCart } from "@/context/cart-context";

const heroVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const gridVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function HomePage() {
  const { totalQuantity } = useCart();
  const {
    data: productsData,
    isLoading,
    isError,
    error,
  } = useFetchProductsQuery(undefined, { skip: false });
  const products = productsData?.data ?? [];
  const errorMessage = getApiErrorMessage(error);
  const productsSectionRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const gridInView = useInView(gridRef, {
    once: true,
    margin: "0px 0px -120px 0px",
  });

  // Debug logging
  if (typeof window !== "undefined") {
    console.log("Products data:", { productsData, products, isLoading, isError, error });
  }

  const scrollToProducts = () => {
    productsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="relative">
        <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
          <ProductCarousel />

          <motion.section
            className="absolute inset-0 z-10 mx-auto flex max-w-6xl flex-col px-6 pt-16 pb-8 sm:px-10"
            initial="hidden"
            animate="show"
            variants={heroVariants}
          >
            <div className="flex items-center justify-between">
              <p className="uppercase tracking-[0.4em] text-white/90 drop-shadow-lg text-[32px] font-bold">
                Mistika
              </p>
              <Link
                href="/cart"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/90 backdrop-blur-sm text-black shadow-[0_10px_24px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5"
                aria-label="Ir al carrito"
              >
                <ShoppingBag size={18} aria-hidden="true" />
                {totalQuantity > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-black px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {totalQuantity}
                  </span>
                ) : null}
              </Link>
            </div>

            <div className="mt-auto mb-8">
              <h1 className="text-4xl font-semibold tracking-[0.08em] text-white drop-shadow-lg sm:text-5xl lg:text-6xl mb-3">
                Bienvenido a tu ritual diario
              </h1>
              <p className="max-w-2xl text-base text-white/90 drop-shadow-md sm:text-lg mb-4">
                Velas artesanales para transformar tu espacio en calma, aroma y
                presencia. Elige tu esencia y siente el cambio desde hoy.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={scrollToProducts}
                  className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:translate-y-[-1px] shadow-lg"
                >
                  Ver productos
                </button>
                <span className="text-xs uppercase tracking-[0.35em] text-white/80 drop-shadow-md">
                  Sin pasos extra
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToProducts}
              className="inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/90 drop-shadow-lg"
              aria-label="Desliza para ver productos"
            >
              <ArrowDown size={16} aria-hidden="true" />
              Desliza
            </button>
          </motion.section>
        </div>
      </div>

      <section
        ref={productsSectionRef}
        className="mx-auto max-w-6xl px-6 pb-20 pt-4 sm:px-10"
      >
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-black/50">
              Coleccion
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[0.08em]">
              Productos seleccionados
            </h2>
          </div>
          <p className="text-sm text-black/60">
            Entrega rapida y compra directa sin fricciones.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-black/60">Cargando productos...</p>
        ) : isError ? (
          <p className="text-sm text-black/60">
            {errorMessage ?? "No se pudieron cargar los productos."}
          </p>
        ) : products.length === 0 ? (
          <p className="text-sm text-black/60">No hay productos disponibles.</p>
        ) : (
          <motion.div
            ref={gridRef}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
            variants={gridVariants}
            initial="hidden"
            animate={gridInView ? "show" : "show"}
          >
            {products.map((product: Product) => (
              <motion.div key={product.id} variants={cardVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </main>
  );
}
