"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Plus, Trash2, Package, Search, Filter, ArrowLeft, AlertTriangle, X } from "lucide-react";
import { useFetchProductsQuery, useDeleteProductMutation } from "@/store/features/products/productsApi";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";
import toast from "react-hot-toast";

export function ProductsAdminView() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<{ id: number; name: string } | null>(null);
  const limit = 20;

  const {
    data: productsData,
    isLoading,
    isError,
    error,
  } = useFetchProductsQuery({ page, limit }, { skip: false });

  const products = productsData?.data ?? [];
  const pagination = productsData?.pagination;
  const errorMessage = getApiErrorMessage(error);

  const [deleteProduct] = useDeleteProductMutation();

  const filteredProducts = products.filter((product: Product) => {
    const categoryName = typeof product.category === "object"
      ? product.category?.name
      : product.category || "";
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    try {
      await deleteProduct(showDeleteModal.id).unwrap();
      toast.success(`"${showDeleteModal.name}" eliminado correctamente`);
      setShowDeleteModal(null);
    } catch (err) {
      toast.error("Error al eliminar el producto");
    }
  };

  const formatPrice = (price: number | null | string) => {
    if (price === null || price === undefined) return "—";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "—";
    return `$${numPrice.toFixed(2)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span className="uppercase tracking-[0.2em]">Volver al dashboard</span>
          </Link>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2">
                <p className="text-xs uppercase tracking-[0.4em] text-black/50">
                  Administración
                </p>
              </div>
              <h1 className="text-4xl font-semibold tracking-[0.05em] sm:text-5xl">
                Productos
              </h1>
              <p className="mt-3 text-base text-black/60">
                Gestiona tu catálogo de productos
              </p>
            </div>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus size={18} aria-hidden="true" />
              Nuevo producto
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-12 py-4 text-black placeholder:text-black/40 transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </motion.div>

        {/* Products */}
        {isLoading ? (
          <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
            <p className="text-black/60">Cargando productos...</p>
          </div>
        ) : isError ? (
          <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <p className="text-black/60">
              {errorMessage ?? "No se pudieron cargar los productos."}
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-black/5">
              <Package size={40} className="text-black/30" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">No hay productos</h2>
            <p className="mb-8 text-black/60">
              {searchQuery ? "No se encontraron productos con ese criterio" : "Comienza agregando tu primer producto"}
            </p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:-translate-y-0.5"
            >
              <Plus size={18} aria-hidden="true" />
              Agregar producto
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {filteredProducts.map((product: Product, index: number) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)]"
                  >
                    {/* Decorative background */}
                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-black/5 blur-2xl transition-transform duration-700 group-hover:scale-150" />

                    {/* Image */}
                    {product.imageUrl && (
                      <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl border border-black/10 bg-black/5">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {product.isOnSale && (
                          <div className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-white">
                            Oferta
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div className="relative">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <h3 className="flex-1 font-semibold leading-tight line-clamp-2">
                          {product.name}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${product.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {product.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <div className="mb-4 space-y-2">
                        <div className="flex items-center gap-2">
                          {product.isOnSale && product.discountPrice ? (
                            <>
                              <span className="font-bold text-red-600">
                                {formatPrice(product.discountPrice)}
                              </span>
                              <span className="text-xs text-black/50 line-through">
                                {formatPrice(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold">{formatPrice(product.price)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-black/60">
                          <span className="rounded-full border border-black/10 bg-black/5 px-2 py-0.5">
                            {typeof product.category === "object"
                              ? product.category?.name
                              : product.category || "Sin categoría"}
                          </span>
                          <span className={product.stock > 0 ? "text-black/60" : "text-red-600"}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="flex-1 rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-black transition hover:bg-black hover:text-white sm:px-4 sm:text-sm"
                        >
                          <Edit size={14} className="mx-auto sm:w-4 sm:h-4" aria-hidden="true" />
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal({ id: product.id, name: product.name })}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-600 transition hover:bg-red-100 sm:px-4"
                          aria-label={`Eliminar ${product.name}`}
                        >
                          <Trash2 size={14} className="sm:w-4 sm:h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
              >
                <p className="text-sm text-black/60">
                  Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} de {pagination.total} productos
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPreviousPage || isLoading}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                  >
                    ←
                  </button>
                  <span className="px-4 text-sm font-medium">
                    Página {page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage || isLoading}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                  >
                    →
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
