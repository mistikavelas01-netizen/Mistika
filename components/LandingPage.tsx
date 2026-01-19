"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowDown, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import ProductCard from "./ProductCard";
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

export default function LandingPage() {
  const { totalQuantity } = useCart();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const {
    data: productsData,
    isLoading,
    isError,
    error,
  } = useFetchProductsQuery({ page: currentPage, limit: pageSize }, { skip: false });

  const products = productsData?.data ?? [];
  const pagination = productsData?.pagination;
  const errorMessage = getApiErrorMessage(error);
  const productsSectionRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const gridInView = useInView(gridRef, {
    once: true,
    margin: "0px 0px -120px 0px",
  });

  const scrollToProducts = () => {
    productsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    scrollToProducts();
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="relative">
        <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
          <ProductCarousel />

          <motion.section
            className="absolute inset-0 z-10 mx-auto flex max-w-6xl flex-col px-6 pb-8 pt-16 sm:px-10"
            initial="hidden"
            animate="show"
            variants={heroVariants}
          >
            <div className="flex items-center justify-between">
              <p className="text-[32px] font-bold uppercase tracking-[0.4em] text-white/90 drop-shadow-lg">
                Mistika
              </p>
              <Link
                href="/cart"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/90 text-black shadow-[0_10px_24px_rgba(0,0,0,0.15)] backdrop-blur-sm transition hover:-translate-y-0.5"
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

            <div className="mb-8 mt-auto">
              <h1 className="mb-3 text-4xl font-semibold tracking-[0.08em] text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
                Bienvenido a tu ritual diario
              </h1>
              <p className="mb-4 max-w-2xl text-base text-white/90 drop-shadow-md sm:text-lg">
                Velas artesanales para transformar tu espacio en calma, aroma y
                presencia. Elige tu esencia y siente el cambio desde hoy.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={scrollToProducts}
                  className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:translate-y-[-1px]"
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
          <>
            <motion.div
              ref={gridRef}
              className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4"
              variants={gridVariants}
              initial="hidden"
              animate={gridInView ? "show" : "hidden"}
              key={currentPage}
            >
              {products.map((product: Product) => (
                <motion.div key={product.id} variants={cardVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-sm text-black/60">
                  Mostrando {(currentPage - 1) * pageSize + 1} -{" "}
                  {Math.min(currentPage * pageSize, pagination.total)} de{" "}
                  {pagination.total} productos
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPreviousPage || isLoading}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1,
                    ).map((page) => {
                      const shouldShow =
                        page === 1 ||
                        page === pagination.totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      if (!shouldShow) {
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 text-sm text-black/40">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          disabled={isLoading}
                          className={`h-10 w-10 rounded-full border text-sm font-medium transition ${
                            page === currentPage
                              ? "border-black bg-black text-white"
                              : "border-black/10 bg-white text-black hover:bg-black/5"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                          aria-label={`Ir a página ${page}`}
                          aria-current={page === currentPage ? "page" : undefined}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNextPage || isLoading}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
